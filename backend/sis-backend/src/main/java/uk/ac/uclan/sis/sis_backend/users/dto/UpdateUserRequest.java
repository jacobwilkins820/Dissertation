package uk.ac.uclan.sis.sis_backend.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

    @Email
    public String email;

    @Size(min = 8, max = 72)
    public String password; // bcrypt input limit ~72 bytes

    public Long roleId;

    public Boolean enabled;
}
