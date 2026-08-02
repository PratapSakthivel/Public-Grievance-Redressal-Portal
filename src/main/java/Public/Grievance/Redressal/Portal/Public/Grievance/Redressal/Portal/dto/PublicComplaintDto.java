package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Intentionally minimal — public-facing, no personal citizen info.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicComplaintDto {

    private UUID id;
    private String title;
    private Category category;
    private String pincode;
    private String areaName;
    private Status status;
    private Integer upvoteCount;
    private Instant createdAt;

    public static PublicComplaintDto fromEntity(Complaint complaint) {
        return PublicComplaintDto.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .category(complaint.getCategory())
                .pincode(complaint.getPincode())
                .areaName(complaint.getAreaName())
                .status(complaint.getStatus())
                .upvoteCount(complaint.getUpvoteCount())
                .createdAt(complaint.getCreatedAt())
                .build();
    }
}
