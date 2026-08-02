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
public class GlobalAnalyticsResponse {
    private List<StatusBreakdownDto> statusBreakdown;
    private List<CategoryBreakdownDto> categoryBreakdown;
    /** Top 10 pincodes by complaint volume */
    private List<PincodeBreakdownDto> pincodeBreakdown;
    private List<VolumeTrendDto> volumeTrend;
    private long totalComplaints;
    private long resolvedCount;
    /** Nullable — null if no complaints resolved globally yet */
    private Double avgResolutionTimeHours;
    /** One entry per department — includes zero-complaint departments */
    private List<DepartmentComparisonDto> departmentComparison;
}
