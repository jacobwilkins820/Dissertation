package uk.ac.uclan.sis.sis_backend.students.mapper;

import org.springframework.stereotype.Component;

import uk.ac.uclan.sis.sis_backend.students.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.dto.StudentResponse;
import uk.ac.uclan.sis.sis_backend.students.dto.UpdateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.entity.StudentStatus;

/**
 * Mapping lives here to keep controllers and services concise.
 * It also makes it explicit which fields are exposed in API responses.
 */
@Component
public class StudentMapper {

    /**
     * Turns a create request into a student entity.
     *
     * @param req create request
     * @return student entity
     */
    public Student toEntity(CreateStudentRequest req) {
        StudentStatus status = parseStatusOrDefault(req.getStatus());
        return new Student(
                req.getUpn(),
                req.getFirstName(),
                req.getLastName(),
                req.getDateOfBirth(),
                req.getGender(),
                status
        );
    }

    /**
     * Applies an update request to an existing student.
     *
     * @param existing student entity to update
     * @param req update request
     */
    public void applyUpdate(Student existing, UpdateStudentRequest req) {
        existing.setUpn(req.getUpn());
        existing.setFirstName(req.getFirstName());
        existing.setLastName(req.getLastName());
        existing.setDateOfBirth(req.getDateOfBirth());
        existing.setGender(req.getGender());
        existing.setStatus(StudentStatus.valueOf(req.getStatus()));
    }

    /**
     * Turns a student entity into an API response.
     *
     * @param s student entity
     * @return student response
     */
    public StudentResponse toResponse(Student s) {
        return new StudentResponse(
                s.getId(),
                s.getUpn(),
                s.getFirstName(),
                s.getLastName(),
                s.getDateOfBirth(),
                s.getGender(),
                s.getStatus().name(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    /**
     * Parses a status string or returns the default.
     *
     * @param status status name
     * @return student status
     */
    private StudentStatus parseStatusOrDefault(String status) {
        if (status == null || status.isBlank()) {
            return StudentStatus.ACTIVE;
        }
        return StudentStatus.valueOf(status);
    }
}
