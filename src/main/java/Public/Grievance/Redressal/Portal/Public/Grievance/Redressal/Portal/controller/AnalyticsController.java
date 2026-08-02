package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.controller;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.DepartmentAnalyticsResponse;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.GlobalAnalyticsResponse;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    private UUID getUserIdFromAuth(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) return uuid;
        return UUID.fromString((String) principal);
    }

    /**
     * GET /analytics/department/{id}
     *
     * DEPT_HEAD: may only access their own department's analytics.
     * SUPER_ADMIN: may access any department's analytics.
     */
    @GetMapping("/department/{id}")
    @PreAuthorize("hasAnyRole('DEPT_HEAD', 'SUPER_ADMIN')")
    public ResponseEntity<DepartmentAnalyticsResponse> getDepartmentAnalytics(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        User requestingUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // DEPT_HEAD scope check — cannot view another department's analytics
        if (requestingUser.getRole() == Role.DEPT_HEAD) {
            if (requestingUser.getDepartment() == null ||
                    !requestingUser.getDepartment().getId().equals(id)) {
                throw new AccessDeniedException(
                        "Department Heads can only view analytics for their own department");
            }
        }

        DepartmentAnalyticsResponse response = analyticsService.getDepartmentAnalytics(id);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /analytics/global
     *
     * SUPER_ADMIN only — full cross-department overview.
     */
    @GetMapping("/global")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<GlobalAnalyticsResponse> getGlobalAnalytics() {
        GlobalAnalyticsResponse response = analyticsService.getGlobalAnalytics();
        return ResponseEntity.ok(response);
    }
}
