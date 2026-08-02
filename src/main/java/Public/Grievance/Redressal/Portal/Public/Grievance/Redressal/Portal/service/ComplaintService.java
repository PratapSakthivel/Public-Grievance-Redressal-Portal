package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.ComplaintDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.FileComplaintRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Priority;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util.CategoryDepartmentMapper;
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
    private final UserRepository userRepository;
    private final CategoryDepartmentMapper categoryDepartmentMapper;

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

        User requestingUser = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + requestingUserId));

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
        // Role.SUPER_ADMIN can access any complaint

        return ComplaintDto.fromEntity(complaint);
    }
}
