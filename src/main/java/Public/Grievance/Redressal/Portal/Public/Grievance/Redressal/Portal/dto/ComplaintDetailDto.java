package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Consolidated complaint detail response: full complaint info + ordered timeline + upvote status.
 * Returned by GET /complaints/{id}/detail — avoids 3 separate fetches on the citizen detail screen.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintDetailDto {

    private ComplaintDto complaint;
    private List<ComplaintUpdateDto> timeline;

    /**
     * Only meaningful for CITIZEN role — true if the requesting citizen has upvoted this complaint.
     * Always false for non-citizen roles (OFFICER, DEPT_HEAD, SUPER_ADMIN).
     */
    private boolean hasUpvoted;
}
