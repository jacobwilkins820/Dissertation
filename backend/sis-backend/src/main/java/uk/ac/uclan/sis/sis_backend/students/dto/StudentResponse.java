package uk.ac.uclan.sis.sis_backend.students.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Response model returned to the frontend.
 * Includes timestamps because they're required by the schema and useful for auditing/debugging.
 */

//TODO: consider what we actually want retured here (e.g., do we want to expose UPNs?)
public class StudentResponse {

    private final Long id;
    private final String upn;
    private final String firstName;
    private final String lastName;
    private final LocalDate dateOfBirth;
    private final String gender;
    private final String status;
    private final Instant createdAt;
    private final Instant updatedAt;

    public StudentResponse(
            Long id,
            String upn,
            String firstName,
            String lastName,
            LocalDate dateOfBirth,
            String gender,
            String status,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.upn = upn;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public String getUpn() { return upn; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getGender() { return gender; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}