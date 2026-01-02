package uk.ac.uclan.sis.sis_backend.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotNull
    @Email
    public String email;

    @NotNull
    @Size(min = 8, max = 72) // bcrypt input limit ~72 bytes
    public String password;

    @NotNull
    public Long roleId;

    @NotNull
    public String firstName;

    @NotNull
    public String lastName;

    public Boolean enabled;

    public Long linkedGuardianId;
}
