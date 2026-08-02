package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.controller;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.AuthResponse;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.LoginRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.RegisterRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
