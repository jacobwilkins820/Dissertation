package uk.ac.uclan.sis.sis_backend.auth.dto;

public class LoginResponse {

    private final String token;
    private final Long userId;
    private final String roleName;

    public LoginResponse(String token, Long userId, String roleName) {
        this.token = token;
        this.userId = userId;
        this.roleName = roleName;
    }

    public String getToken() {
        return token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getRoleName() {
        return roleName;
    }
}
