package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VolumeTrendDto {
    private LocalDate date;
    private long count;
}
