package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.ComplaintDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.ComplaintUpdateDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.FileComplaintRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.ComplaintUpdate;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Priority;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.InvalidRoleException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.InvalidStatusTransitionException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintUpdateRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util.CategoryDepartmentMapper;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util.ComplaintStatusValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintUpdateRepository complaintUpdateRepository;
    private final UserRepository userRepository;
    private final CategoryDepartmentMapper categoryDepartmentMapper;
    private final ComplaintStatusValidator statusValidator;

    // ────────────────────────────────────────────────────────────
    // Phase 3: Filing & Retrieval
    // ────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintDto fileComplaint(UUID citizenId, FileComplaintRequest request) {
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen user not found with ID: " + citizenId));

        Department department = categoryDepartmentMapper.getDepartmentForCategory(request.getCategory());

        // TODO: Phase 5 duplicate detection (category + pincode match) with upvote prompt

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
    // Phase 4: Assignment Workflow
    // ────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintDto assignOfficer(UUID complaintId, UUID officerId, UUID actingDeptHeadId) {
        Complaint complaint = getComplaintOrThrow(complaintId);
        User deptHead = getUserOrThrow(actingDeptHeadId);
        User officer = getUserOrThrow(officerId);

        // Dept head can only assign within their own department
        validateDeptHeadScope(deptHead, complaint);

        // Target officer must have OFFICER role
        if (officer.getRole() != Role.OFFICER) {
            throw new InvalidRoleException("Target user is not an Officer");
        }

        // Officer must belong to the same department as the complaint
        if (officer.getDepartment() == null || !officer.getDepartment().getId().equals(complaint.getDepartment().getId())) {
            throw new IllegalArgumentException("Officer does not belong to the same department as this complaint");
        }

        // assignOfficer only valid from FILED status
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

        // reassignOfficer only allowed from ASSIGNED or IN_PROGRESS
        Status currentStatus = complaint.getStatus();
        if (currentStatus != Status.ASSIGNED && currentStatus != Status.IN_PROGRESS) {
            throw new IllegalArgumentException(
                    "Cannot reassign: complaint must be in ASSIGNED or IN_PROGRESS status (current: " + currentStatus + ")");
        }

        String oldOfficerName = complaint.getAssignedOfficer() != null
                ? complaint.getAssignedOfficer().getName() : "Unassigned";

        complaint.setAssignedOfficer(newOfficer);
        Complaint saved = complaintRepository.save(complaint);

        // Status unchanged on reassignment — record old_status = new_status = current
        recordUpdate(saved, deptHead, currentStatus, currentStatus,
                "Reassigned from " + oldOfficerName + " to " + newOfficer.getName());

        return ComplaintDto.fromEntity(saved);
    }

    @Transactional
    public ComplaintDto updateStatus(UUID complaintId, Status newStatus, String remarks, UUID actingUserId) {
        Complaint complaint = getComplaintOrThrow(complaintId);
        User actor = getUserOrThrow(actingUserId);

        // Validate acting user is authorized to update this complaint's status
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
        // SUPER_ADMIN can update any

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
