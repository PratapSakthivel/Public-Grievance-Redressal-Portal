package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.config;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@portal.gov}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.admin.name:Super Admin}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByRole(Role.SUPER_ADMIN)) {
            User admin = User.builder()
                    .name(adminName)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.SUPER_ADMIN)
                    .build();

            userRepository.save(admin);
            log.info("Successfully seeded default Super Admin account: {}", adminEmail);
        } else {
            log.info("Super Admin account already exists. Skipping seed.");
        }
    }
}
