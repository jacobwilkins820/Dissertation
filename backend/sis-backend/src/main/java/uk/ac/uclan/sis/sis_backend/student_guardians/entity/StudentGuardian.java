package uk.ac.uclan.sis.sis_backend.student_guardians.entity;

import jakarta.persistence.*;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;

/**
 * Join table with metadata:
 * - relationship (Mother/Father/Carer)
 * - is_primary (one guardian will be the "main contact" for a student)
 */
@Entity
@Table(name = "student_guardians")
public class StudentGuardian {

    @EmbeddedId
    private StudentGuardianId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("studentId") // ties this FK to the embedded PK field
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("guardianId")
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(name = "relationship", nullable = false, length = 50)
    private String relationship;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    /**
     * Creates a student-guardian entity for JPA.
     */
    protected StudentGuardian() {}

    /**
     * Creates a student-guardian link entity.
     *
     * @param student student entity
     * @param guardian guardian entity
     * @param relationship relationship label
     * @param isPrimary primary flag
     */
    public StudentGuardian(Student student, Guardian guardian, String relationship, boolean isPrimary) {
        this.student = student;
        this.guardian = guardian;
        this.id = new StudentGuardianId(student.getId(), guardian.getId());
        this.relationship = relationship;
        this.isPrimary = isPrimary;
    }

    /**
     * Returns the composite id.
     *
     * @return composite id
     */
    public StudentGuardianId getId() {
        return id;
    }

    /**
     * Returns the student entity.
     *
     * @return student entity
     */
    public Student getStudent() {
        return student;
    }

    /**
     * Returns the guardian entity.
     *
     * @return guardian entity
     */
    public Guardian getGuardian() {
        return guardian;
    }

    /**
     * Returns the relationship label.
     *
     * @return relationship label
     */
    public String getRelationship() {
        return relationship;
    }

    /**
     * Sets the relationship label.
     *
     * @param relationship relationship label
     */
    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    /**
     * Returns whether the link is primary.
     *
     * @return true when primary
     */
    public boolean isPrimary() {
        return isPrimary;
    }

    /**
     * Sets whether the link is primary.
     *
     * @param primary primary flag
     */
    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }
}
