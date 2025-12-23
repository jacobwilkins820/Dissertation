package uk.ac.uclan.sis.sis_backend.classes.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.classes.dto.*;
import uk.ac.uclan.sis.sis_backend.classes.service.ClassService;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassResponse create(@RequestBody CreateClassRequest request) {
        return classService.create(request);
    }

    @GetMapping
    public List<ClassListItemResponse> list() {
        return classService.listAll();
    }

    @GetMapping("/{id}")
    public ClassResponse getById(@PathVariable Long id) {
        return classService.getById(id);
    }

    @PutMapping("/{id}")
    public ClassResponse update(
            @PathVariable Long id,
            @RequestBody UpdateClassRequest request
    ) {
        return classService.update(id, request);
    }

    // dev note: explicit endpoint to avoid "null vs not provided" ambiguity
    @PutMapping("/{id}/teacher/unassign")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unassignTeacher(@PathVariable Long id) {
        classService.unassignTeacher(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        classService.delete(id);
    }
}
