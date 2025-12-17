package uk.ac.uclan.sis.sis_backend.student;

import uk.ac.uclan.sis.sis_backend.student.dto.StudentResponse;

public class StudentMapper {

    public static StudentResponse toResponse(Student s) {
        return new StudentResponse(
            s.getId(),
            s.getFirstName(),
            s.getLastName()
        );
    }
}
