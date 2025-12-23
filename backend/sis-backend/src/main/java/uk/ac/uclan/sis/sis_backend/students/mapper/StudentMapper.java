package uk.ac.uclan.sis.sis_backend.students.mapper;

import org.springframework.stereotype.Component;

import uk.ac.uclan.sis.sis_backend.students.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.dto.StudentResponse;
import uk.ac.uclan.sis.sis_backend.students.dto.UpdateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.entity.StudentStatus;

/**
 * Mapping lives here so controllers/services don't end up full of repetitive code.
 * It also makes it very obvious what fields we expose in API responses.
 */
@Component
public class StudentMapper {

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

    public void applyUpdate(Student existing, UpdateStudentRequest req) {
        existing.setUpn(req.getUpn());
        existing.setFirstName(req.getFirstName());
        existing.setLastName(req.getLastName());
        existing.setDateOfBirth(req.getDateOfBirth());
        existing.setGender(req.getGender());
        existing.setStatus(StudentStatus.valueOf(req.getStatus()));
    }

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

    private StudentStatus parseStatusOrDefault(String status) {
        if (status == null || status.isBlank()) {
            return StudentStatus.ACTIVE;
        }
        return StudentStatus.valueOf(status);
    }
}