package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PincodeBreakdownDto {
    private String pincode;
    private long count;
}
