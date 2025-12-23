package uk.ac.uclan.sis.sis_backend.users.dto;

import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import java.time.Instant;

public class UserDetailResponse {
    public Long id;
    public String email;
    public boolean enabled;
    public Role role;
    public Instant createdAt;
    public Instant updatedAt;
}
