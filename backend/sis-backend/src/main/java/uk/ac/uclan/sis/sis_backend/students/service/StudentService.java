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
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;
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
    private final AuditLogService auditLogService;

    /**
     * Creates the student service.
     *
     * @param repo repository for students
     * @param mapper mapper for DTO conversions
     * @param authorizationService service for permission checks
     * @param studentGuardianRepository repository for guardian links
     */
    public StudentService(
            StudentRepository repo,
            StudentMapper mapper,
            AuthorizationService authorizationService,
            StudentGuardianRepository studentGuardianRepository,
            AuditLogService auditLogService
    ) {
        this.repo = repo;
        this.mapper = mapper;
        this.authorizationService = authorizationService;
        this.studentGuardianRepository = studentGuardianRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Returns a student by id with access checks.
     *
     * @param id student id
     * @return student response
     */
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

    /**
     * Returns a paged list of students filtered by query.
     *
     * @param q search term
     * @param pageable paging request
     * @return page of student responses
     */
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


    /**
     * Creates a student record.
     *
     * @param request create request payload
     * @return created student response
     */
    @Transactional
    public StudentResponse create(CreateStudentRequest request) {
        authorizationService.require(currentUser(), Permissions.CREATE_STUDENT);
        // Check before hitting the DB unique constraint.
        if (repo.existsByUpn(request.getUpn())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "UPN already exists");
        }

        Student saved = repo.save(mapper.toEntity(request));
        auditLogService.log(
                null,
                "STUDENT_CREATED",
                "STUDENT",
                saved.getId(),
                "upn=" + saved.getUpn() + ", status=" + saved.getStatus()
        );
        return mapper.toResponse(saved);
    }

    /**
     * Updates a student record.
     *
     * @param id student id
     * @param request update request payload
     * @return updated student response
     */
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
        auditLogService.log(
                null,
                "STUDENT_UPDATED",
                "STUDENT",
                saved.getId(),
                "upn=" + saved.getUpn() + ", status=" + saved.getStatus()
        );
        return mapper.toResponse(saved);
    }

    /**
     * Deletes a student record.
     *
     * @param id student id
     */
    @Transactional
    public void delete(Long id) {
        authorizationService.require(currentUser(), Permissions.CREATE_STUDENT);
        Student existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        repo.deleteById(id);
        auditLogService.log(
                null,
                "STUDENT_DELETED",
                "STUDENT",
                id,
                "upn=" + existing.getUpn()
        );
    }

    /**
     * Returns the current authenticated user.
     *
     * @return current user principal
     */
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
