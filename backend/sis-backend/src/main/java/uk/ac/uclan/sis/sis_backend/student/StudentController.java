package uk.ac.uclan.sis.sis_backend.student;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.student.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.student.dto.StudentResponse;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentResponse> all() {
        return service.list();
    }

    @GetMapping("/{id}")
    public StudentResponse one(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping                     
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody CreateStudentRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}