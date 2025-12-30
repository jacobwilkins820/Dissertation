package uk.ac.uclan.sis.sis_backend.auth.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uk.ac.uclan.sis.sis_backend.auth.dto.LoginRequest;
import uk.ac.uclan.sis.sis_backend.auth.dto.LoginResponse;
import uk.ac.uclan.sis.sis_backend.auth.dto.LogoutResponse;
import uk.ac.uclan.sis.sis_backend.auth.dto.MeResponse;
import uk.ac.uclan.sis.sis_backend.auth.service.MeService;
import uk.ac.uclan.sis.sis_backend.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final MeService meService;

    public AuthController(AuthService authService, MeService meService) {
        this.authService = authService;
        this.meService = meService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/logout")
    public ResponseEntity<LogoutResponse> logout() {
        return ResponseEntity.ok(authService.logout());
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me() {
        return ResponseEntity.ok(meService.getMe());
    }

}
