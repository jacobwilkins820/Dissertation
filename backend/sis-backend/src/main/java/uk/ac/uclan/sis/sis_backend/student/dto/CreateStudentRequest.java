package uk.ac.uclan.sis.sis_backend.student.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateStudentRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }

    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}
