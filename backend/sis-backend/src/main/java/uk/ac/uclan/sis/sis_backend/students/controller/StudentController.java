package uk.ac.uclan.sis.sis_backend.students.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.validation.Valid;
import uk.ac.uclan.sis.sis_backend.students.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.dto.StudentResponse;
import uk.ac.uclan.sis.sis_backend.students.dto.UpdateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.service.StudentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for student management.
 *
 * Controller rule reminder: do HTTP stuff only (validation, status codes, routing).
 * Everything else belongs in the service.
 */
@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

@GetMapping
public ResponseEntity<Page<StudentResponse>> list(
        @RequestParam(required = false) String q,
        Pageable pageable
) {
    return ResponseEntity.ok(service.list(q, pageable));
}


    @GetMapping("/{id}")
    public StudentResponse getStudent(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse createStudent(@Valid @RequestBody CreateStudentRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public StudentResponse updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStudentRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id) {
        service.delete(id);
    }
}