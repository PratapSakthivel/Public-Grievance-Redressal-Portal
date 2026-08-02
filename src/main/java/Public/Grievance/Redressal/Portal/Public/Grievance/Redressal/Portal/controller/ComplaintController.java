package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.controller;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.*;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
    @PreAuthorize("hasAnyRole('DEPT_HEAD', 'SUPER_ADMIN')")
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
    @PreAuthorize("hasAnyRole('DEPT_HEAD', 'SUPER_ADMIN')")
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

    // ─── Phase 5: Citizen-Facing Features ────────────────────────────────

    @GetMapping("/check-duplicates")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<List<PublicComplaintDto>> checkDuplicates(
            @RequestParam Category category,
            @RequestParam String pincode
    ) {
        List<PublicComplaintDto> similar = complaintService.checkForSimilarComplaints(category, pincode);
        return ResponseEntity.ok(similar);
    }

    @PostMapping("/{id}/upvote")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<Map<String, Object>> upvoteComplaint(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID citizenId = getUserIdFromAuth(authentication);
        Integer updatedCount = complaintService.upvoteComplaint(id, citizenId);
        return ResponseEntity.ok(Map.of(
                "complaintId", id,
                "upvoteCount", updatedCount
        ));
    }

    @DeleteMapping("/{id}/upvote")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<Map<String, Object>> removeUpvote(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID citizenId = getUserIdFromAuth(authentication);
        Integer updatedCount = complaintService.removeUpvote(id, citizenId);
        return ResponseEntity.ok(Map.of(
                "complaintId", id,
                "upvoteCount", updatedCount
        ));
    }

    @GetMapping("/public")
    public ResponseEntity<Page<PublicComplaintDto>> getPublicFeed(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<PublicComplaintDto> publicFeed = complaintService.getPublicFeed(category, pincode, status, page, size);
        return ResponseEntity.ok(publicFeed);
    }

    @GetMapping("/{id}/detail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ComplaintDetailDto> getComplaintDetail(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID userId = getUserIdFromAuth(authentication);
        ComplaintDetailDto detail = complaintService.getComplaintDetail(id, userId);
        return ResponseEntity.ok(detail);
    }
}
