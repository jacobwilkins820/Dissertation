package uk.ac.uclan.sis.sis_backend.auth.dto;

public class LoginResponse {

    private final String token;
    private final Long userId;
    private final String roleName;
    private final String firstName;


    public LoginResponse(String token, Long userId, String roleName, String firstName) {
        this.token = token;
        this.userId = userId;
        this.roleName = roleName;
        this.firstName = firstName;
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
    
    public String getFirstName() {
        return firstName;
    }
}
