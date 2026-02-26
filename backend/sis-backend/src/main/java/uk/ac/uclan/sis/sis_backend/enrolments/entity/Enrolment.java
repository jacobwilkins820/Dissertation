package uk.ac.uclan.sis.sis_backend.enrolments.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;

@Entity
@Table(
        name = "enrolments",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_enrolments_student_class_year",
                        columnNames = {"student_id", "class_id", "academic_year_id"}
                )
        }
)
public class Enrolment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Class clazz; // "class" reserved; use clazz instead.

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Sets audit timestamps on insert.
     */
    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * Updates the audit timestamp on update.
     */
    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Gets the enrolment id.
     *
     * @return enrolment id
     */
    public Long getId() {
        return id;
    }

    /**
     * Gets the student entity.
     *
     * @return student entity
     */
    public Student getStudent() {
        return student;
    }

    /**
     * Sets the student entity.
     *
     * @param student student entity
     */
    public void setStudent(Student student) {
        this.student = student;
    }

    /**
     * Gets the class entity.
     *
     * @return class entity
     */
    public Class getClazz() {
        return clazz;
    }

    /**
     * Sets the class entity.
     *
     * @param clazz class entity
     */
    public void setClazz(Class clazz) {
        this.clazz = clazz;
    }

    /**
     * Gets the academic year entity.
     *
     * @return academic year entity
     */
    public AcademicYear getAcademicYear() {
        return academicYear;
    }

    /**
     * Sets the academic year entity.
     *
     * @param academicYear academic year entity
     */
    public void setAcademicYear(AcademicYear academicYear) {
        this.academicYear = academicYear;
    }

    /**
     * Gets the start date.
     *
     * @return start date
     */
    public LocalDate getStartDate() {
        return startDate;
    }

    /**
     * Sets the start date.
     *
     * @param startDate start date
     */
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    /**
     * Gets the end date.
     *
     * @return end date
     */
    public LocalDate getEndDate() {
        return endDate;
    }

    /**
     * Sets the end date.
     *
     * @param endDate end date
     */
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    /**
     * Gets the created timestamp.
     *
     * @return created timestamp
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Gets the updated timestamp.
     *
     * @return updated timestamp
     */
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
