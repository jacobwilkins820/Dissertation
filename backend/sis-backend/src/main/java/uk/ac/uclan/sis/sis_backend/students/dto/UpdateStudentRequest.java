package uk.ac.uclan.sis.sis_backend.students.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Request body for updating a student.
 * UPN updates are rare but still allowed.
 */
public class UpdateStudentRequest {

    @NotBlank
    @Size(max = 20)
    private String upn;

    @NotBlank
    @Size(max = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    private String lastName;

    @NotNull
    private LocalDate dateOfBirth;

    @Size(max = 20)
    private String gender;

    @NotBlank
    @Pattern(regexp = "ACTIVE|INACTIVE|WITHDRAWN", message = "status must be ACTIVE, INACTIVE, or WITHDRAWN")
    private String status;

    public String getUpn() { return upn; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getGender() { return gender; }
    public String getStatus() { return status; }

    public void setUpn(String upn) { this.upn = upn; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setGender(String gender) { this.gender = gender; }
    public void setStatus(String status) { this.status = status; }
}