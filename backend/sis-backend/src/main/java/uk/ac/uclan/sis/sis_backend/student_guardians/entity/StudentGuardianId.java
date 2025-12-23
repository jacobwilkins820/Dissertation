package uk.ac.uclan.sis.sis_backend.student_guardians.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite PK for the join table.
 * Should keep duplicates impossible (student_id + guardian_id is unique).
 */
@Embeddable
public class StudentGuardianId implements Serializable {

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "guardian_id", nullable = false)
    private Long guardianId;

    // Default constructor
    protected StudentGuardianId() {}

    public StudentGuardianId(Long studentId, Long guardianId) {
        this.studentId = studentId;
        this.guardianId = guardianId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public Long getGuardianId() {
        return guardianId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentGuardianId that)) return false;
        return Objects.equals(studentId, that.studentId)
                && Objects.equals(guardianId, that.guardianId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, guardianId);
    }
}