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

    /**
     * Sets up the student controller.
     *
     * @param service service for student operations
     */
    public StudentController(StudentService service) {
        this.service = service;
    }

    /**
     * Gets a page of students with optional search.
     *
     * @param q search term
     * @param pageable paging request
     * @return page of students
     */
    @GetMapping
    public ResponseEntity<Page<StudentResponse>> list(
            @RequestParam(required = false) String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(service.list(q, pageable));
    }


    /**
     * Gets a student by id.
     *
     * @param id student id
     * @return student response
     */
    @GetMapping("/{id}")
    public StudentResponse getStudent(@PathVariable Long id) {
        return service.getById(id);
    }

    /**
     * Creates a new student.
     *
     * @param request create request body
     * @return created student response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse createStudent(@Valid @RequestBody CreateStudentRequest request) {
        return service.create(request);
    }

    /**
     * Updates a student.
     *
     * @param id student id
     * @param request update request body
     * @return updated student response
     */
    @PutMapping("/{id}")
    public StudentResponse updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStudentRequest request
    ) {
        return service.update(id, request);
    }

    /**
     * Deletes a student.
     *
     * @param id student id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id) {
        service.delete(id);
    }
}
