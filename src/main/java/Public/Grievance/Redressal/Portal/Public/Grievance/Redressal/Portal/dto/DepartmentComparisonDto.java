package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentComparisonDto {
    private UUID departmentId;
    private String departmentName;
    private long totalComplaints;
    private long resolvedCount;
    private Double avgResolutionTimeHours;
}
