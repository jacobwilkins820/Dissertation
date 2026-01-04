package uk.ac.uclan.sis.sis_backend.students.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.students.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.dto.StudentResponse;
import uk.ac.uclan.sis.sis_backend.students.dto.UpdateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.mapper.StudentMapper;
import uk.ac.uclan.sis.sis_backend.students.repository.StudentRepository;
import uk.ac.uclan.sis.sis_backend.student_guardians.repository.StudentGuardianRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

@Service
public class StudentService {

    private final StudentRepository repo;
    private final StudentMapper mapper;
    private final AuthorizationService authorizationService;
    private final StudentGuardianRepository studentGuardianRepository;

    public StudentService(
            StudentRepository repo,
            StudentMapper mapper,
            AuthorizationService authorizationService,
            StudentGuardianRepository studentGuardianRepository
    ) {
        this.repo = repo;
        this.mapper = mapper;
        this.authorizationService = authorizationService;
        this.studentGuardianRepository = studentGuardianRepository;
    }

    public StudentResponse getById(Long id) {
        User user = currentUser();
        authorizationService.require(user, Permissions.VIEW_STUDENT_DETAILS);

        Long guardianId = user.getLinkedGuardianId();
        if (guardianId != null
                && studentGuardianRepository
                        .findByIdStudentIdAndIdGuardianId(id, guardianId)
                        .isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student not linked to guardian");
        }

        Student student = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        return mapper.toResponse(student);
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> list(String q, Pageable pageable) {
        User user = currentUser();
        authorizationService.require(user, Permissions.VIEW_STUDENT_DIRECTORY);

        Page<Student> page;
        Long guardianId = user.getLinkedGuardianId();

        if (q == null || q.trim().isEmpty()) {
            if (guardianId != null) {
                page = repo.findByGuardianId(guardianId, pageable);
            } else {
                // No search term: return all students (paged)
                page = repo.findAll(pageable);
            }
        } else {
            // Search by first name, last name, or UPN
            String term = q.trim();
            if (guardianId != null) {
                page = repo.searchByGuardian(guardianId, term, pageable);
            } else {
                page = repo.search(term, pageable);
            }
        }

        return page.map(mapper::toResponse);
    }


    @Transactional
    public StudentResponse create(CreateStudentRequest request) {
        authorizationService.require(currentUser(), Permissions.CREATE_STUDENT);
        // check before we hit the DB unique constraint.
        if (repo.existsByUpn(request.getUpn())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "UPN already exists");
        }

        Student saved = repo.save(mapper.toEntity(request));
        return mapper.toResponse(saved);
    }

    @Transactional
    public StudentResponse update(Long id, UpdateStudentRequest request) {
        authorizationService.require(currentUser(), Permissions.EDIT_STUDENT_DETAILS);
        Student existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        // If UPN is changed, prevent duplicates.
        repo.findByUpn(request.getUpn())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "UPN already exists");
                });

        mapper.applyUpdate(existing, request);
        Student saved = repo.save(existing);
        return mapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        authorizationService.require(currentUser(), Permissions.CREATE_STUDENT);
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }
        repo.deleteById(id);
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
