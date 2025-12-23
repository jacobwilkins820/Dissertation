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

    protected StudentGuardian() {}

    public StudentGuardian(Student student, Guardian guardian, String relationship, boolean isPrimary) {
        this.student = student;
        this.guardian = guardian;
        this.id = new StudentGuardianId(student.getId(), guardian.getId());
        this.relationship = relationship;
        this.isPrimary = isPrimary;
    }

    public StudentGuardianId getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public Guardian getGuardian() {
        return guardian;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }
}