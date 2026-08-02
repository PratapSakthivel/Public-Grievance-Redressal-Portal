package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.controller;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.*;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    private UUID getUserIdFromAuth(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        } else if (principal instanceof String str) {
            return UUID.fromString(str);
        }
        throw new IllegalStateException("Unauthenticated user context");
    }

    // ─── Phase 3: Filing & Retrieval ────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ComplaintDto> fileComplaint(
            @Valid @RequestBody FileComplaintRequest request,
            Authentication authentication
    ) {
        UUID citizenId = getUserIdFromAuth(authentication);
        ComplaintDto complaint = complaintService.fileComplaint(citizenId, request);
        return ResponseEntity.ok(complaint);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<List<ComplaintDto>> getMyComplaints(Authentication authentication) {
        UUID citizenId = getUserIdFromAuth(authentication);
        List<ComplaintDto> complaints = complaintService.getComplaintsByCitizen(citizenId);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/department")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<List<ComplaintDto>> getDepartmentComplaints(Authentication authentication) {
        UUID deptHeadUserId = getUserIdFromAuth(authentication);
        List<ComplaintDto> complaints = complaintService.getComplaintsByDepartment(deptHeadUserId);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('OFFICER')")
    public ResponseEntity<List<ComplaintDto>> getAssignedComplaints(Authentication authentication) {
        UUID officerId = getUserIdFromAuth(authentication);
        List<ComplaintDto> complaints = complaintService.getComplaintsByOfficer(officerId);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ComplaintDto> getComplaintById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        ComplaintDto complaint = complaintService.getComplaintById(id, userId);
        return ResponseEntity.ok(complaint);
    }

    // ─── Phase 4: Assignment & Status ───────────────────────────────────

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<ComplaintDto> assignOfficer(
            @PathVariable UUID id,
            @Valid @RequestBody AssignOfficerRequest request,
            Authentication authentication
    ) {
        UUID deptHeadId = getUserIdFromAuth(authentication);
        ComplaintDto updated = complaintService.assignOfficer(id, request.getOfficerId(), deptHeadId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/reassign")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<ComplaintDto> reassignOfficer(
            @PathVariable UUID id,
            @Valid @RequestBody AssignOfficerRequest request,
            Authentication authentication
    ) {
        UUID deptHeadId = getUserIdFromAuth(authentication);
        ComplaintDto updated = complaintService.reassignOfficer(id, request.getOfficerId(), deptHeadId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OFFICER', 'DEPT_HEAD', 'SUPER_ADMIN')")
    public ResponseEntity<ComplaintDto> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication
    ) {
        UUID actingUserId = getUserIdFromAuth(authentication);
        ComplaintDto updated = complaintService.updateStatus(id, request.getNewStatus(), request.getRemarks(), actingUserId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ComplaintUpdateDto>> getTimeline(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        List<ComplaintUpdateDto> timeline = complaintService.getTimeline(id, userId);
        return ResponseEntity.ok(timeline);
    }
}
