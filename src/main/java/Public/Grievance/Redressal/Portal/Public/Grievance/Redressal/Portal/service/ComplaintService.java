package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.*;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.ComplaintUpdate;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.ComplaintUpvote;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Priority;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.DuplicateResourceException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.InvalidRoleException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintUpdateRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintUpvoteRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util.CategoryDepartmentMapper;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util.ComplaintStatusValidator;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintUpdateRepository complaintUpdateRepository;
    private final ComplaintUpvoteRepository complaintUpvoteRepository;
    private final UserRepository userRepository;
    private final CategoryDepartmentMapper categoryDepartmentMapper;
    private final ComplaintStatusValidator statusValidator;

    // ────────────────────────────────────────────────────────────
    // Phase 3 & Phase 5: Filing, Duplicate Checking & Retrieval
    // ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PublicComplaintDto> checkForSimilarComplaints(Category category, String pincode) {
        List<Status> openStatuses = List.of(Status.FILED, Status.ASSIGNED, Status.IN_PROGRESS);
        return complaintRepository.findByCategoryAndPincodeAndStatusIn(category, pincode, openStatuses).stream()
                .map(PublicComplaintDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ComplaintDto fileComplaint(UUID citizenId, FileComplaintRequest request) {
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen user not found with ID: " + citizenId));

        Department department = categoryDepartmentMapper.getDepartmentForCategory(request.getCategory());

        // Phase 5 duplicate detection: citizen checks similar complaints before submitting via checkForSimilarComplaints

        Complaint complaint = Complaint.builder()
                .citizen(citizen)
                .department(department)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .pincode(request.getPincode())
                .areaName(request.getAreaName())
                .status(Status.FILED)
                .priority(Priority.LOW)
                .upvoteCount(0)
                .build();

        Complaint savedComplaint = complaintRepository.save(complaint);
        return ComplaintDto.fromEntity(savedComplaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> getComplaintsByCitizen(UUID citizenId) {
        return complaintRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId).stream()
                .map(ComplaintDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> getComplaintsByDepartment(UUID deptHeadUserId) {
        User user = userRepository.findById(deptHeadUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Department Head user not found with ID: " + deptHeadUserId));

        if (user.getDepartment() == null) {
            throw new ResourceNotFoundException("Department Head is not assigned to any department");
        }

        return complaintRepository.findByDepartmentIdOrderByCreatedAtDesc(user.getDepartment().getId()).stream()
                .map(ComplaintDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> getComplaintsByOfficer(UUID officerId) {
        return complaintRepository.findByAssignedOfficerIdOrderByCreatedAtDesc(officerId).stream()
                .map(ComplaintDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComplaintDto getComplaintById(UUID complaintId, UUID requestingUserId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        enforceReadAccess(complaint, requestingUserId);
        return ComplaintDto.fromEntity(complaint);
    }

    // ────────────────────────────────────────────────────────────
    // Phase 4: Assignment Workflow & Status Updates
    // ────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintDto assignOfficer(UUID complaintId, UUID officerId, UUID actingDeptHeadId) {
        Complaint complaint = getComplaintOrThrow(complaintId);
        User deptHead = getUserOrThrow(actingDeptHeadId);
        User officer = getUserOrThrow(officerId);

        validateDeptHeadScope(deptHead, complaint);

        if (officer.getRole() != Role.OFFICER) {
            throw new InvalidRoleException("Target user is not an Officer");
        }

        if (officer.getDepartment() == null || !officer.getDepartment().getId().equals(complaint.getDepartment().getId())) {
            throw new IllegalArgumentException("Officer does not belong to the same department as this complaint");
        }

        if (complaint.getStatus() != Status.FILED) {
            throw new IllegalArgumentException(
                    "Cannot assign: complaint is in status " + complaint.getStatus() +
                    ". Use reassign for already-assigned complaints.");
        }

        Status oldStatus = complaint.getStatus();
        statusValidator.validate(oldStatus, Status.ASSIGNED);

        complaint.setAssignedOfficer(officer);
        complaint.setStatus(Status.ASSIGNED);
        Complaint saved = complaintRepository.save(complaint);

        recordUpdate(saved, deptHead, oldStatus, Status.ASSIGNED,
                "Assigned to " + officer.getName());

        return ComplaintDto.fromEntity(saved);
    }

    @Transactional
    public ComplaintDto reassignOfficer(UUID complaintId, UUID newOfficerId, UUID actingDeptHeadId) {
        Complaint complaint = getComplaintOrThrow(complaintId);
        User deptHead = getUserOrThrow(actingDeptHeadId);
        User newOfficer = getUserOrThrow(newOfficerId);

        validateDeptHeadScope(deptHead, complaint);

        if (newOfficer.getRole() != Role.OFFICER) {
            throw new InvalidRoleException("Target user is not an Officer");
        }

        if (newOfficer.getDepartment() == null || !newOfficer.getDepartment().getId().equals(complaint.getDepartment().getId())) {
            throw new IllegalArgumentException("Officer does not belong to the same department as this complaint");
        }

        Status currentStatus = complaint.getStatus();
        if (currentStatus != Status.ASSIGNED && currentStatus != Status.IN_PROGRESS) {
            throw new IllegalArgumentException(
                    "Cannot reassign: complaint must be in ASSIGNED or IN_PROGRESS status (current: " + currentStatus + ")");
        }

        String oldOfficerName = complaint.getAssignedOfficer() != null
                ? complaint.getAssignedOfficer().getName() : "Unassigned";

        complaint.setAssignedOfficer(newOfficer);
        Complaint saved = complaintRepository.save(complaint);

        recordUpdate(saved, deptHead, currentStatus, currentStatus,
                "Reassigned from " + oldOfficerName + " to " + newOfficer.getName());

        return ComplaintDto.fromEntity(saved);
    }

    @Transactional
    public ComplaintDto updateStatus(UUID complaintId, Status newStatus, String remarks, UUID actingUserId) {
        Complaint complaint = getComplaintOrThrow(complaintId);
        User actor = getUserOrThrow(actingUserId);

        Role role = actor.getRole();
        if (role == Role.OFFICER) {
            if (complaint.getAssignedOfficer() == null || !complaint.getAssignedOfficer().getId().equals(actingUserId)) {
                throw new AccessDeniedException("Officers can only update status of complaints assigned to them");
            }
        } else if (role == Role.DEPT_HEAD) {
            validateDeptHeadScope(actor, complaint);
        } else if (role == Role.CITIZEN) {
            throw new AccessDeniedException("Citizens are not allowed to update complaint status");
        }

        Status oldStatus = complaint.getStatus();
        statusValidator.validate(oldStatus, newStatus);

        complaint.setStatus(newStatus);
        Complaint saved = complaintRepository.save(complaint);

        recordUpdate(saved, actor, oldStatus, newStatus, remarks);

        return ComplaintDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ComplaintUpdateDto> getTimeline(UUID complaintId, UUID requestingUserId) {
        Complaint complaint = getComplaintOrThrow(complaintId);
        enforceReadAccess(complaint, requestingUserId);

        return complaintUpdateRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId).stream()
                .map(ComplaintUpdateDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ────────────────────────────────────────────────────────────
    // Phase 5: Upvoting, Public Feed & Detailed View
    // ────────────────────────────────────────────────────────────

    @Transactional
    public Integer upvoteComplaint(UUID complaintId, UUID citizenId) {
        Complaint complaint = getComplaintOrThrow(complaintId);

        if (complaint.getCitizen().getId().equals(citizenId)) {
            throw new IllegalArgumentException("Citizens cannot upvote their own complaints");
        }

        if (complaintUpvoteRepository.existsByComplaintIdAndCitizenId(complaintId, citizenId)) {
            throw new DuplicateResourceException("You have already upvoted this complaint");
        }

        User citizen = getUserOrThrow(citizenId);
        ComplaintUpvote upvote = ComplaintUpvote.builder()
                .complaint(complaint)
                .citizen(citizen)
                .build();
        complaintUpvoteRepository.save(upvote);

        int newCount = (complaint.getUpvoteCount() == null ? 0 : complaint.getUpvoteCount()) + 1;
        complaint.setUpvoteCount(newCount);
        complaintRepository.save(complaint);

        return newCount;
    }

    @Transactional
    public Integer removeUpvote(UUID complaintId, UUID citizenId) {
        Complaint complaint = getComplaintOrThrow(complaintId);

        ComplaintUpvote upvote = complaintUpvoteRepository.findByComplaintIdAndCitizenId(complaintId, citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("Upvote not found for this complaint"));

        complaintUpvoteRepository.delete(upvote);

        int currentCount = complaint.getUpvoteCount() == null ? 0 : complaint.getUpvoteCount();
        int newCount = Math.max(0, currentCount - 1);
        complaint.setUpvoteCount(newCount);
        complaintRepository.save(complaint);

        return newCount;
    }

    @Transactional(readOnly = true)
    public Page<PublicComplaintDto> getPublicFeed(Category category, String pincode, Status status, int page, int size) {
        Specification<Complaint> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (pincode != null && !pincode.isBlank()) {
                predicates.add(cb.equal(root.get("pincode"), pincode));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("upvoteCount"), Sort.Order.desc("createdAt")));
        return complaintRepository.findAll(spec, pageable)
                .map(PublicComplaintDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public ComplaintDetailDto getComplaintDetail(UUID complaintId, UUID requestingUserId) {
        ComplaintDto complaintDto = getComplaintById(complaintId, requestingUserId);
        List<ComplaintUpdateDto> timeline = getTimeline(complaintId, requestingUserId);

        User requestingUser = getUserOrThrow(requestingUserId);
        boolean hasUpvoted = false;

        if (requestingUser.getRole() == Role.CITIZEN) {
            hasUpvoted = complaintUpvoteRepository.existsByComplaintIdAndCitizenId(complaintId, requestingUserId);
        }

        return ComplaintDetailDto.builder()
                .complaint(complaintDto)
                .timeline(timeline)
                .hasUpvoted(hasUpvoted)
                .build();
    }

    // ────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────

    private Complaint getComplaintOrThrow(UUID complaintId) {
        return complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    private void validateDeptHeadScope(User deptHead, Complaint complaint) {
        if (deptHead.getDepartment() == null || complaint.getDepartment() == null ||
                !deptHead.getDepartment().getId().equals(complaint.getDepartment().getId())) {
            throw new AccessDeniedException("Department Heads can only manage complaints in their own department");
        }
    }

    private void enforceReadAccess(Complaint complaint, UUID requestingUserId) {
        User requestingUser = getUserOrThrow(requestingUserId);
        Role role = requestingUser.getRole();

        if (role == Role.CITIZEN) {
            if (!complaint.getCitizen().getId().equals(requestingUserId)) {
                throw new AccessDeniedException("Citizens are only allowed to view their own complaints");
            }
        } else if (role == Role.DEPT_HEAD) {
            if (requestingUser.getDepartment() == null || complaint.getDepartment() == null ||
                    !complaint.getDepartment().getId().equals(requestingUser.getDepartment().getId())) {
                throw new AccessDeniedException("Department Heads can only view complaints belonging to their department");
            }
        } else if (role == Role.OFFICER) {
            if (complaint.getAssignedOfficer() == null || !complaint.getAssignedOfficer().getId().equals(requestingUserId)) {
                throw new AccessDeniedException("Officers can only view complaints assigned to them");
            }
        }
        // SUPER_ADMIN sees all
    }

    private void recordUpdate(Complaint complaint, User actor, Status oldStatus, Status newStatus, String remarks) {
        ComplaintUpdate update = ComplaintUpdate.builder()
                .complaint(complaint)
                .actor(actor)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .remarks(remarks)
                .build();
        complaintUpdateRepository.save(update);
    }
}
