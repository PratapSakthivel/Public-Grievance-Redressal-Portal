package com.grievance.controller;

import com.grievance.dto.ComplaintRequest;
import com.grievance.dto.ComplaintResponse;
import com.grievance.dto.ComplaintUpdateRequest;
import com.grievance.entity.User;
import com.grievance.enums.ComplaintStatus;
import com.grievance.exception.UnauthorizedException;
import com.grievance.repository.UserRepository;
import com.grievance.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {
    
    private final ComplaintService complaintService;
    private final UserRepository userRepository;
    
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        String email = auth.getName();
        return userRepository.findByEmail(email).orElse(null);
    }
    
    @PostMapping
    public ResponseEntity<ComplaintResponse> fileComplaint(@Valid @RequestBody ComplaintRequest request) {
        User user = getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("User must be logged in to file a complaint");
        }
        return ResponseEntity.ok(complaintService.fileComplaint(request, user.getId()));
    }
    
    @GetMapping("/public")
    public ResponseEntity<List<ComplaintResponse>> getPublicFeed() {
        return ResponseEntity.ok(complaintService.getPublicFeed());
    }
    
    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints() {
        User user = getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("User must be logged in");
        }
        return ResponseEntity.ok(complaintService.getComplaintsByCitizen(user.getId()));
    }
    
    @GetMapping("/assigned")
    public ResponseEntity<List<ComplaintResponse>> getAssignedComplaints() {
        User user = getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("User must be logged in");
        }
        return ResponseEntity.ok(complaintService.getComplaintsAssignedToOfficer(user.getId()));
    }
    
    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<ComplaintResponse>> getDepartmentComplaints(@PathVariable Long deptId) {
        return ResponseEntity.ok(complaintService.getComplaintsByDepartment(deptId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintDetails(@PathVariable Long id) {
        User user = getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(complaintService.getComplaintDetails(id, userId));
    }
    
    @PostMapping("/{id}/upvote")
    public ResponseEntity<ComplaintResponse> toggleUpvote(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("User must be logged in to upvote");
        }
        return ResponseEntity.ok(complaintService.toggleUpvote(id, user.getId()));
    }
    
    @PutMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assignOfficer(@PathVariable Long id, @RequestBody ComplaintUpdateRequest request) {
        User user = getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("User must be logged in");
        }
        if (request.getAssignedOfficerId() == null) {
            throw new IllegalArgumentException("Assigned officer ID is required");
        }
        return ResponseEntity.ok(complaintService.assignOfficer(id, request.getAssignedOfficerId(), user.getId()));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody ComplaintUpdateRequest request) {
        User user = getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("User must be logged in");
        }
        if (request.getNewStatus() == null) {
            throw new IllegalArgumentException("New status is required");
        }
        return ResponseEntity.ok(complaintService.updateStatus(id, request.getNewStatus(), request.getRemarks(), user.getId()));
    }
    
    @GetMapping("/similar")
    public ResponseEntity<List<ComplaintResponse>> getSimilarOpenComplaints(
            @RequestParam String category,
            @RequestParam String pincode) {
        return ResponseEntity.ok(complaintService.getSimilarOpenComplaints(category, pincode));
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<ComplaintResponse>> getFilteredComplaints(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) Long departmentId,
            Pageable pageable) {
        User user = getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(complaintService.getFilteredComplaints(category, pincode, status, departmentId, pageable, userId));
    }
}
