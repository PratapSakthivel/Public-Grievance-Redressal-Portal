package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.ComplaintUpdate;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
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
public class ComplaintUpdateDto {

    private UUID id;

    private UUID complaintId;

    private UUID actorId;
    private String actorName;
    private Role actorRole;

    private Status oldStatus;
    private Status newStatus;
    private String remarks;

    private Instant createdAt;

    public static ComplaintUpdateDto fromEntity(ComplaintUpdate update) {
        return ComplaintUpdateDto.builder()
                .id(update.getId())
                .complaintId(update.getComplaint() != null ? update.getComplaint().getId() : null)
                .actorId(update.getActor() != null ? update.getActor().getId() : null)
                .actorName(update.getActor() != null ? update.getActor().getName() : null)
                .actorRole(update.getActor() != null ? update.getActor().getRole() : null)
                .oldStatus(update.getOldStatus())
                .newStatus(update.getNewStatus())
                .remarks(update.getRemarks())
                .createdAt(update.getCreatedAt())
                .build();
    }
}
