package uk.ac.uclan.sis.sis_backend.student_guardians.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite PK for the join table.
 * Keeps duplicates impossible (student_id + guardian_id is unique).
 */
@Embeddable
public class StudentGuardianId implements Serializable {

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "guardian_id", nullable = false)
    private Long guardianId;

    /**
     * Creates a composite id for JPA.
     */
    protected StudentGuardianId() {}

    /**
     * Creates a composite id.
     *
     * @param studentId student id
     * @param guardianId guardian id
     */
    public StudentGuardianId(Long studentId, Long guardianId) {
        this.studentId = studentId;
        this.guardianId = guardianId;
    }

    /**
     * Returns the student id.
     *
     * @return student id
     */
    public Long getStudentId() {
        return studentId;
    }

    /**
     * Returns the guardian id.
     *
     * @return guardian id
     */
    public Long getGuardianId() {
        return guardianId;
    }

    /**
     * Compares composite ids.
     *
     * @param o object to compare
     * @return true when equal
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentGuardianId that)) return false;
        return Objects.equals(studentId, that.studentId)
                && Objects.equals(guardianId, that.guardianId);
    }

    /**
     * Returns a hash code for the composite id.
     *
     * @return hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(studentId, guardianId);
    }
}
