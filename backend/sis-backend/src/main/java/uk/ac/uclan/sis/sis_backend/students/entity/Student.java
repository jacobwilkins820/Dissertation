package uk.ac.uclan.sis.sis_backend.students.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * JPA entity mapped to the `students` table.
 *
 * This class is the database shape. The API shape is handled by DTOs.
 * created_at / updated_at are required by the schema and are set automatically.
 */
@Entity
@Table(
        name = "students",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_students_upn", columnNames = "upn")
        }
)
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="upn", length = 20, nullable = false, unique = true)
    private String upn;

    @Column(name="first_name", length = 100, nullable = false)
    private String firstName;

    @Column(name="last_name", length = 100, nullable = false)
    private String lastName;

    @Column(name="date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name="gender", length = 20, nullable = false)
    private String gender;

    @Enumerated(EnumType.STRING)
    @Column(name="status", length = 20, nullable = false)
    private StudentStatus status;

    @Column(name="created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name="updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Creates a student entity for JPA.
     */
    public Student() {}

    /**
     * Creates a student entity.
     *
     * @param upn unique pupil number
     * @param firstName first name
     * @param lastName last name
     * @param dateOfBirth date of birth
     * @param gender gender value
     * @param status student status
     */
    public Student(String upn, String firstName, String lastName, LocalDate dateOfBirth, String gender, StudentStatus status) {
        this.upn = upn;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.status = status;
    }

    /**
     * Sets audit timestamps on insert.
     */
    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * Updates the audit timestamp on update.
     */
    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Returns the student id.
     *
     * @return student id
     */
    public Long getId() {
        return id;
    }

    /**
     * Returns the unique pupil number.
     *
     * @return unique pupil number
     */
    public String getUpn() {
        return upn;
    }

    /**
     * Returns the first name.
     *
     * @return first name
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     * Returns the last name.
     *
     * @return last name
     */
    public String getLastName() {
        return lastName;
    }

    /**
     * Returns the date of birth.
     *
     * @return date of birth
     */
    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    /**
     * Returns the gender value.
     *
     * @return gender value
     */
    public String getGender() {
        return gender;
    }

    /**
     * Returns the student status.
     *
     * @return student status
     */
    public StudentStatus getStatus() {
        return status;
    }

    /**
     * Returns the created timestamp.
     *
     * @return created timestamp
     */
    public Instant getCreatedAt() {
        return createdAt;
    }

    /**
     * Returns the updated timestamp.
     *
     * @return updated timestamp
     */
    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Sets the unique pupil number.
     *
     * @param upn unique pupil number
     */
    public void setUpn(String upn) {
        this.upn = upn;
    }

    /**
     * Sets the first name.
     *
     * @param firstName first name
     */
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    /**
     * Sets the last name.
     *
     * @param lastName last name
     */
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    /**
     * Sets the date of birth.
     *
     * @param dateOfBirth date of birth
     */
    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    /**
     * Sets the gender value.
     *
     * @param gender gender value
     */
    public void setGender(String gender) {
        this.gender = gender;
    }

    /**
     * Sets the student status.
     *
     * @param status student status
     */
    public void setStatus(StudentStatus status) {
        this.status = status;
    }
}
