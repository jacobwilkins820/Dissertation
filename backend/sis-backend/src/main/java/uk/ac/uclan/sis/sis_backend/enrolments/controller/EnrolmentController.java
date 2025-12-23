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

    public EnrolmentController(EnrolmentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnrolmentResponse create(@Valid @RequestBody CreateEnrolmentRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public EnrolmentResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/classes/{classId}/enrolments")
    public List<EnrolmentListItemResponse> listByClass(
            @PathVariable Long classId,
            @RequestParam Long academicYearId
    ) {
        return service.listByClass(classId, academicYearId);
    }

    @GetMapping("/students/{studentId}/enrolments")
    public List<EnrolmentListItemResponse> listByStudent(
            @PathVariable Long studentId,
            @RequestParam Long academicYearId
    ) {
        return service.listByStudent(studentId, academicYearId);
    }

    @PutMapping("/{id}")
    public EnrolmentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateEnrolmentRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
