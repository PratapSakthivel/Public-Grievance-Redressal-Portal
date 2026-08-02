package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentAnalyticsResponse {
    private List<StatusBreakdownDto> statusBreakdown;
    private List<CategoryBreakdownDto> categoryBreakdown;
    private List<VolumeTrendDto> volumeTrend;
    private long totalComplaints;
    private long resolvedCount;
    /** Nullable — null if no complaints have been resolved in this department yet */
    private Double avgResolutionTimeHours;
}
