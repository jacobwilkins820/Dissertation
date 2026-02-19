package uk.ac.uclan.sis.sis_backend.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateGuardianUserRequest {

    @NotNull
    public String firstName;

    @NotNull
    public String lastName;

    @NotNull
    @Email
    public String email;

    @NotNull
    @Size(min = 8, max = 72) // bcrypt input limit ~72 bytes
    public String password;

    public String phone;
    public String addressLine1;
    public String addressLine2;
    public String city;
    public String postcode;
}
