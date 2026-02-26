package uk.ac.uclan.sis.sis_backend.enrolments.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import uk.ac.uclan.sis.sis_backend.enrolments.dto.*;
import uk.ac.uclan.sis.sis_backend.enrolments.service.EnrolmentService;

import java.util.List;

@RestController
@RequestMapping("/api/enrolments")
public class EnrolmentController {

    private final EnrolmentService service;

    /**
     * Sets up the enrolment controller.
     *
     * @param service service for enrolment operations
     */
    public EnrolmentController(EnrolmentService service) {
        this.service = service;
    }

    /**
     * Creates an enrolment.
     *
     * @param req create request body
     * @return created enrolment response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnrolmentResponse create(@Valid @RequestBody CreateEnrolmentRequest req) {
        return service.create(req);
    }

    /**
     * Gets an enrolment by id.
     *
     * @param id enrolment id
     * @return enrolment response
     */
    @GetMapping("/{id}")
    public EnrolmentResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    /**
     * Gets enrolments for a class and academic year.
     *
     * @param classId class id
     * @param academicYearId academic year id
     * @return list of enrolment list items
     */
    @GetMapping("/classes/{classId}/enrolments")
    public List<EnrolmentListItemResponse> listByClass(
            @PathVariable Long classId,
            @RequestParam Long academicYearId
    ) {
        return service.listByClass(classId, academicYearId);
    }

    /**
     * Gets enrolments for a student and academic year.
     *
     * @param studentId student id
     * @param academicYearId academic year id
     * @return list of enrolment list items
     */
    @GetMapping("/students/{studentId}/enrolments")
    public List<EnrolmentListItemResponse> listByStudent(
            @PathVariable Long studentId,
            @RequestParam Long academicYearId
    ) {
        return service.listByStudent(studentId, academicYearId);
    }

    /**
     * Updates an enrolment by id.
     *
     * @param id enrolment id
     * @param req update request body
     * @return updated enrolment response
     */
    @PutMapping("/{id}")
    public EnrolmentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateEnrolmentRequest req) {
        return service.update(id, req);
    }

    /**
     * Deletes an enrolment by id.
     *
     * @param id enrolment id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
