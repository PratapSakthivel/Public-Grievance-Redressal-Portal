package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.controller;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.CreateStaffRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.UpdateDepartmentRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.UpdateRoleRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.UserDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDto> createStaffUser(@Valid @RequestBody CreateStaffRequest request) {
        UserDto user = userService.createStaffUser(request);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UUID departmentId
    ) {
        List<UserDto> users = userService.getAllUsers(role, departmentId);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        UserDto user = userService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/department")
    public ResponseEntity<UserDto> updateUserDepartment(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDepartmentRequest request
    ) {
        UserDto user = userService.updateUserDepartment(id, request.getDepartmentId());
        return ResponseEntity.ok(user);
    }
}
