package uk.ac.uclan.sis.sis_backend.students.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import uk.ac.uclan.sis.sis_backend.students.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.dto.StudentResponse;
import uk.ac.uclan.sis.sis_backend.students.dto.UpdateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.mapper.StudentMapper;
import uk.ac.uclan.sis.sis_backend.students.repository.StudentRepository;

/**
 * Business logic layer.
 * This is where we enforce rules like UPN uniqueness and clean error responses.
 */
@Service
public class StudentService {

    private final StudentRepository repo;
    private final StudentMapper mapper;

    public StudentService(StudentRepository repo, StudentMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    public StudentResponse getById(Long id) {
        Student student = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        return mapper.toResponse(student);
    }

    @Transactional(readOnly = true)
        public Page<StudentResponse> list(String q, Pageable pageable) {

        Page<Student> page;

        if (q == null || q.trim().isEmpty()) {
            // No search term → return all students (paged)
            page = repo.findAll(pageable);
        } else {
            // Search by first name, last name, or UPN
            String term = q.trim();
            page = repo.search(term, pageable);
        }

        return page.map(mapper::toResponse);
    }


    @Transactional
    public StudentResponse create(CreateStudentRequest request) {
        // check before we hit the DB unique constraint.
        if (repo.existsByUpn(request.getUpn())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "UPN already exists");
        }

        Student saved = repo.save(mapper.toEntity(request));
        return mapper.toResponse(saved);
    }

    @Transactional
    public StudentResponse update(Long id, UpdateStudentRequest request) {
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
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }
        repo.deleteById(id);
    }
}