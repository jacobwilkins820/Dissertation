package uk.ac.uclan.sis.sis_backend.students.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * JPA entity mapped to the `students` table.
 *
 * This class is the database shape. The API shape is handled by DTOs.
 * created_at / updated_at are required by the schema and are set them automatically.
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

    public Student() {
        // Default constructor for student.
    }

    public Student(String upn, String firstName, String lastName, LocalDate dateOfBirth, String gender, StudentStatus status) {
        this.upn = upn;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.status = status;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getUpn() { return upn; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getGender() { return gender; }
    public StudentStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    // Setters (only what we expect to change)
    public void setUpn(String upn) { this.upn = upn; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setGender(String gender) { this.gender = gender; }
    public void setStatus(StudentStatus status) { this.status = status; }
}
