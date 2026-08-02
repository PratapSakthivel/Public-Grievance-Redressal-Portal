package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.controller;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.AssignHeadRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.DepartmentDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.DepartmentRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody DepartmentRequest request) {
        DepartmentDto department = departmentService.createDepartment(request);
        return ResponseEntity.ok(department);
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDto>> getAllDepartments() {
        List<DepartmentDto> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DepartmentDto> updateDepartment(
            @PathVariable UUID id,
            @Valid @RequestBody DepartmentRequest request
    ) {
        DepartmentDto department = departmentService.updateDepartment(id, request);
        return ResponseEntity.ok(department);
    }

    @PutMapping("/{id}/assign-head")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DepartmentDto> assignHead(
            @PathVariable UUID id,
            @Valid @RequestBody AssignHeadRequest request
    ) {
        DepartmentDto department = departmentService.assignHead(id, request.getUserId());
        return ResponseEntity.ok(department);
    }
}
