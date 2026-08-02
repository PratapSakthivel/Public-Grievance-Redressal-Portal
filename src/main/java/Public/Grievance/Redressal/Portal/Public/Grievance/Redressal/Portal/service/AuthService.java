package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.AuthResponse;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.LoginRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.RegisterRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.UserDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.DuplicateEmailException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.InvalidCredentialsException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("User with email " + request.getEmail() + " already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CITIZEN)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(savedUser))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(user))
                .build();
    }
}
