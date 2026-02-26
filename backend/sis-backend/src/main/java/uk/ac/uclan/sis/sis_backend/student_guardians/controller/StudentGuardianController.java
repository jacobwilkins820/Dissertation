package uk.ac.uclan.sis.sis_backend.student_guardians.controller;

import jakarta.validation.Valid;
import uk.ac.uclan.sis.sis_backend.student_guardians.dto.StudentGuardianResponse;
import uk.ac.uclan.sis.sis_backend.student_guardians.dto.UpsertStudentGuardianLinkRequest;
import uk.ac.uclan.sis.sis_backend.student_guardians.service.StudentGuardianService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StudentGuardianController {

    private final StudentGuardianService studentGuardianService;

    /**
     * Sets up the student-guardian controller.
     *
     * @param studentGuardianService service for link operations
     */
    public StudentGuardianController(StudentGuardianService studentGuardianService) {
        this.studentGuardianService = studentGuardianService;
    }

    /**
     * Creates or updates link metadata between a student and guardian.
     *
     * @param studentId student id
     * @param guardianId guardian id
     * @param request link request body
     * @return student-guardian response
     */
    @PutMapping("/students/{studentId}/guardians/{guardianId}")
    public StudentGuardianResponse upsertLink(
            @PathVariable Long studentId,
            @PathVariable Long guardianId,
            @Valid @RequestBody UpsertStudentGuardianLinkRequest request
    ) {
        return studentGuardianService.upsertLink(studentId, guardianId, request);
    }

    /**
     * Gets links for a student.
     *
     * @param studentId student id
     * @return list of student-guardian responses
     */
    @GetMapping("/students/{studentId}/guardians")
    public List<StudentGuardianResponse> listByStudent(@PathVariable Long studentId) {
        return studentGuardianService.listByStudent(studentId);
    }

    /**
     * Gets links for a guardian.
     *
     * @param guardianId guardian id
     * @return list of student-guardian responses
     */
    @GetMapping("/guardians/{guardianId}/students")
    public List<StudentGuardianResponse> listByGuardian(@PathVariable Long guardianId) {
        return studentGuardianService.listByGuardian(guardianId);
    }

    /**
     * Deletes a student-guardian link.
     *
     * @param studentId student id
     * @param guardianId guardian id
     */
    @DeleteMapping("/students/{studentId}/guardians/{guardianId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLink(@PathVariable Long studentId, @PathVariable Long guardianId) {
        studentGuardianService.deleteLink(studentId, guardianId);
    }
}
