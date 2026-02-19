package uk.ac.uclan.sis.sis_backend.users.dto;

import jakarta.validation.constraints.Email;

public class UpdateCurrentUserRequest {

    public String firstName;

    public String lastName;

    @Email
    public String email;
}
