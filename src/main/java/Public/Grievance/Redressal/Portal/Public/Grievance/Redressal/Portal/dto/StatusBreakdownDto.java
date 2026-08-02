package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusBreakdownDto {
    private String status;
    private long count;
}
