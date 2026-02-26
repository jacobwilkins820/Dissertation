package uk.ac.uclan.sis.sis_backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import uk.ac.uclan.sis.sis_backend.auth.dto.LoginRequest;
import uk.ac.uclan.sis.sis_backend.auth.dto.LoginResponse;
import uk.ac.uclan.sis.sis_backend.auth.dto.LogoutResponse;
import uk.ac.uclan.sis.sis_backend.common.exception.AuthException;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Sets up the auth service with required dependencies.
     *
     * @param userRepository repository for user lookups
     * @param passwordEncoder encoder for password verification
     * @param jwtService service for token generation
     */
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Logs in the user and issues a JWT.
     *
     * @param request login request body
     * @return login response with token and user details
     */
    public LoginResponse login(LoginRequest request) {
        // Find user by email.
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new AuthException("Login Failed", "Invalid Credentials"));

        // Reject disabled users.
        if (!user.isEnabled()) {
            throw new AuthException("Login User", "User Is Disabled");
        }

        // Validate the password hash.
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Login User", "Invalid Credentials");
        }

        // Create token and return response.
        String token = jwtService.generateToken(user);
        String roleName = user.getRole() == null ? null : user.getRole().getName();
        return new LoginResponse(token, user.getId(), roleName, user.getFirstName());
    }

    /**
     * Gets a logout confirmation response.
     *
     * @return logout response
     */
    public LogoutResponse logout() {
        String confirmMessage = "User logged out successfully";
        return new LogoutResponse(confirmMessage);
    }
}
