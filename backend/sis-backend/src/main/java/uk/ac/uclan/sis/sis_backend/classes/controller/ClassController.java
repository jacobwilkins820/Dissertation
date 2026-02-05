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

    /**
     * Creates the class controller.
     *
     * @param classService service for class operations
     */
    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    /**
     * Creates a class.
     *
     * @param request create request payload
     * @return created class response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassResponse create(@RequestBody CreateClassRequest request) {
        return classService.create(request);
    }

    /**
     * Returns all classes as list items.
     *
     * @return list of class list items
     */
    @GetMapping
    public List<ClassListItemResponse> list() {
        return classService.listAll();
    }

    /**
     * Returns a class by id.
     *
     * @param id class id
     * @return class response
     */
    @GetMapping("/{id}")
    public ClassResponse getById(@PathVariable Long id) {
        return classService.getById(id);
    }

    /**
     * Updates a class by id.
     *
     * @param id class id
     * @param request update request payload
     * @return updated class response
     */
    @PutMapping("/{id}")
    public ClassResponse update(
            @PathVariable Long id,
            @RequestBody UpdateClassRequest request
    ) {
        return classService.update(id, request);
    }

    /**
     * Unassigns a teacher from a class.
     *
     * @param id class id
     */
    @PutMapping("/{id}/teacher/unassign")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unassignTeacher(@PathVariable Long id) {
        classService.unassignTeacher(id);
    }

    /**
     * Deletes a class by id.
     *
     * @param id class id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        classService.delete(id);
    }
}
