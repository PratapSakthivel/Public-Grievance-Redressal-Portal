package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Priority;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintDto {

    private UUID id;

    private UUID citizenId;
    private String citizenName;

    private UUID departmentId;
    private String departmentName;

    private UUID assignedOfficerId;
    private String assignedOfficerName;

    private String title;
    private String description;
    private Category category;
    private String pincode;
    private String areaName;

    private Status status;
    private Priority priority;
    private Integer upvoteCount;

    private Instant createdAt;
    private Instant updatedAt;

    public static ComplaintDto fromEntity(Complaint complaint) {
        return ComplaintDto.builder()
                .id(complaint.getId())
                .citizenId(complaint.getCitizen() != null ? complaint.getCitizen().getId() : null)
                .citizenName(complaint.getCitizen() != null ? complaint.getCitizen().getName() : null)
                .departmentId(complaint.getDepartment() != null ? complaint.getDepartment().getId() : null)
                .departmentName(complaint.getDepartment() != null ? complaint.getDepartment().getName() : null)
                .assignedOfficerId(complaint.getAssignedOfficer() != null ? complaint.getAssignedOfficer().getId() : null)
                .assignedOfficerName(complaint.getAssignedOfficer() != null ? complaint.getAssignedOfficer().getName() : null)
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .category(complaint.getCategory())
                .pincode(complaint.getPincode())
                .areaName(complaint.getAreaName())
                .status(complaint.getStatus())
                .priority(complaint.getPriority())
                .upvoteCount(complaint.getUpvoteCount())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .build();
    }
}
