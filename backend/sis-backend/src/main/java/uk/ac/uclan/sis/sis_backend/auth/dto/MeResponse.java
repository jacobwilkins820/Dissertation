package uk.ac.uclan.sis.sis_backend.auth.dto;

public class MeResponse {

    private final Long userId;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final String roleName;
    private final Long guardianId; // nullable

    public MeResponse(
            Long userId,
            String email,
            String firstName,
            String lastName,
            String roleName,
            Long guardianId
    ) {
        this.userId = userId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roleName = roleName;
        this.guardianId = guardianId;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getRoleName() { return roleName; }
    public Long getGuardianId() { return guardianId; }
}
