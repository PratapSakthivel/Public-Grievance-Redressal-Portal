package com.grievance.service;

import com.grievance.dto.ComplaintRequest;
import com.grievance.dto.ComplaintResponse;
import com.grievance.dto.TimelineEntry;
import com.grievance.entity.*;
import com.grievance.enums.ComplaintStatus;
import com.grievance.enums.Priority;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.exception.UnauthorizedException;
import com.grievance.repository.*;
import com.grievance.websocket.ComplaintWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {
    
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintUpvoteRepository complaintUpvoteRepository;
    private final ComplaintUpdateRepository complaintUpdateRepository;
    private final ComplaintWebSocketHandler webSocketHandler;
    
    public ComplaintResponse getComplaintDetails(Long id, Long currentUserId) {
        Complaint complaint = complaintRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint", "id", id));
            
        boolean hasUpvoted = false;
        if (currentUserId != null) {
            hasUpvoted = complaintUpvoteRepository.existsByComplaintIdAndCitizenId(id, currentUserId);
        }
        
        return convertToResponse(complaint, hasUpvoted);
    }
    
    @Transactional
    public ComplaintResponse fileComplaint(ComplaintRequest request, Long citizenId) {
        User citizen = userRepository.findById(citizenId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", citizenId));
            
        Department dept = departmentRepository.findById(request.getDepartmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            
        Complaint complaint = Complaint.builder()
            .citizen(citizen)
            .department(dept)
            .title(request.getTitle())
            .description(request.getDescription())
            .category(request.getCategory())
            .pincode(request.getPincode())
            .areaName(request.getAreaName())
            .status(ComplaintStatus.FILED)
            .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
            .upvoteCount(0)
            .build();
            
        Complaint saved = complaintRepository.save(complaint);
        
        // Log initial timeline event
        ComplaintUpdate update = ComplaintUpdate.builder()
            .complaint(saved)
            .actor(citizen)
            .oldStatus(null)
            .newStatus(ComplaintStatus.FILED)
            .remarks("Complaint filed by citizen.")
            .build();
        complaintUpdateRepository.save(update);
        
        // Notify WebSocket
        webSocketHandler.broadcast("{\"event\":\"NEW_COMPLAINT\",\"complaintId\":" + saved.getId() + ",\"title\":\"" + saved.getTitle() + "\"}");
        
        return convertToResponse(saved, false);
    }
    
    @Transactional
    public List<ComplaintResponse> getSimilarOpenComplaints(String category, String pincode) {
        List<ComplaintStatus> closedStatuses = Arrays.asList(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED);
        List<Complaint> similar = complaintRepository.findSimilarOpenComplaints(category, pincode, closedStatuses);
        return similar.stream()
            .map(c -> convertToResponse(c, false))
            .collect(Collectors.toList());
    }
    
    @Transactional
    public ComplaintResponse toggleUpvote(Long complaintId, Long citizenId) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint", "id", complaintId));
            
        User citizen = userRepository.findById(citizenId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", citizenId));
            
        var upvoteOpt = complaintUpvoteRepository.findByComplaintIdAndCitizenId(complaintId, citizenId);
        boolean hasUpvoted;
        if (upvoteOpt.isPresent()) {
            complaintUpvoteRepository.delete(upvoteOpt.get());
            complaint.setUpvoteCount(Math.max(0, complaint.getUpvoteCount() - 1));
            hasUpvoted = false;
        } else {
            ComplaintUpvote upvote = ComplaintUpvote.builder()
                .complaint(complaint)
                .citizen(citizen)
                .build();
            complaintUpvoteRepository.save(upvote);
            complaint.setUpvoteCount(complaint.getUpvoteCount() + 1);
            hasUpvoted = true;
        }
        
        Complaint saved = complaintRepository.save(complaint);
        
        // Notify WebSocket
        webSocketHandler.broadcast("{\"event\":\"UPVOTE_TOGGLE\",\"complaintId\":" + saved.getId() + ",\"upvotes\":" + saved.getUpvoteCount() + "}");
        
        return convertToResponse(saved, hasUpvoted);
    }
    
    @Transactional
    public ComplaintResponse assignOfficer(Long complaintId, Long officerId, Long actorId) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint", "id", complaintId));
            
        User officer = userRepository.findById(officerId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));
            
        User actor = userRepository.findById(actorId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", actorId));
            
        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setAssignedOfficer(officer);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        
        Complaint saved = complaintRepository.save(complaint);
        
        ComplaintUpdate update = ComplaintUpdate.builder()
            .complaint(saved)
            .actor(actor)
            .oldStatus(oldStatus)
            .newStatus(ComplaintStatus.ASSIGNED)
            .remarks("Complaint assigned to officer: " + officer.getName())
            .build();
        complaintUpdateRepository.save(update);
        
        webSocketHandler.broadcast("{\"event\":\"COMPLAINT_ASSIGNED\",\"complaintId\":" + saved.getId() + ",\"officer\":\"" + officer.getName() + "\"}");
        
        return convertToResponse(saved, false);
    }
    
    @Transactional
    public ComplaintResponse updateStatus(Long complaintId, ComplaintStatus newStatus, String remarks, Long actorId) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint", "id", complaintId));
            
        User actor = userRepository.findById(actorId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", actorId));
            
        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(newStatus);
        
        Complaint saved = complaintRepository.save(complaint);
        
        ComplaintUpdate update = ComplaintUpdate.builder()
            .complaint(saved)
            .actor(actor)
            .oldStatus(oldStatus)
            .newStatus(newStatus)
            .remarks(remarks)
            .build();
        complaintUpdateRepository.save(update);
        
        webSocketHandler.broadcast("{\"event\":\"STATUS_UPDATE\",\"complaintId\":" + saved.getId() + ",\"status\":\"" + newStatus.name() + "\"}");
        
        return convertToResponse(saved, false);
    }
    
    public List<ComplaintResponse> getComplaintsByCitizen(Long citizenId) {
        return complaintRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId).stream()
            .map(c -> convertToResponse(c, complaintUpvoteRepository.existsByComplaintIdAndCitizenId(c.getId(), citizenId)))
            .collect(Collectors.toList());
    }
    
    public List<ComplaintResponse> getComplaintsByDepartment(Long departmentId) {
        return complaintRepository.findByDepartmentIdOrderByCreatedAtDesc(departmentId).stream()
            .map(c -> convertToResponse(c, false))
            .collect(Collectors.toList());
    }
    
    public List<ComplaintResponse> getComplaintsAssignedToOfficer(Long officerId) {
        return complaintRepository.findByAssignedOfficerIdOrderByCreatedAtDesc(officerId).stream()
            .map(c -> convertToResponse(c, false))
            .collect(Collectors.toList());
    }
    
    public Page<ComplaintResponse> getFilteredComplaints(String category, String pincode, ComplaintStatus status, Long departmentId, Pageable pageable, Long currentUserId) {
        Page<Complaint> complaints = complaintRepository.findWithFilters(category, pincode, status, departmentId, pageable);
        return complaints.map(c -> {
            boolean hasUpvoted = currentUserId != null && complaintUpvoteRepository.existsByComplaintIdAndCitizenId(c.getId(), currentUserId);
            return convertToResponse(c, hasUpvoted);
        });
    }
    
    public List<ComplaintResponse> getPublicFeed() {
        // Exclude closed or resolved complaints if desired, or show all except closed
        List<Complaint> publicList = complaintRepository.findAllExceptStatus(ComplaintStatus.CLOSED);
        return publicList.stream()
            .map(c -> convertToResponse(c, false))
            .collect(Collectors.toList());
    }
    
    private ComplaintResponse convertToResponse(Complaint complaint, boolean hasUpvoted) {
        List<TimelineEntry> timeline = complaintUpdateRepository.findByComplaintIdWithActor(complaint.getId()).stream()
            .map(u -> TimelineEntry.builder()
                .id(u.getId())
                .oldStatus(u.getOldStatus())
                .newStatus(u.getNewStatus())
                .remarks(u.getRemarks())
                .actorId(u.getActor().getId())
                .actorName(u.getActor().getName())
                .actorRole(u.getActor().getRole().name())
                .createdAt(u.getCreatedAt())
                .build())
            .collect(Collectors.toList());
            
        return ComplaintResponse.builder()
            .id(complaint.getId())
            .title(complaint.getTitle())
            .description(complaint.getDescription())
            .category(complaint.getCategory())
            .pincode(complaint.getPincode())
            .areaName(complaint.getAreaName())
            .status(complaint.getStatus())
            .priority(complaint.getPriority())
            .upvoteCount(complaint.getUpvoteCount())
            .hasUpvoted(hasUpvoted)
            .citizenId(complaint.getCitizen().getId())
            .citizenName(complaint.getCitizen().getName())
            .departmentId(complaint.getDepartment().getId())
            .departmentName(complaint.getDepartment().getName())
            .assignedOfficerId(complaint.getAssignedOfficer() != null ? complaint.getAssignedOfficer().getId() : null)
            .assignedOfficerName(complaint.getAssignedOfficer() != null ? complaint.getAssignedOfficer().getName() : null)
            .createdAt(complaint.getCreatedAt())
            .updatedAt(complaint.getUpdatedAt())
            .timeline(timeline)
            .build();
    }
}
