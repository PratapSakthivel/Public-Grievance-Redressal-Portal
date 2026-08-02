package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignOfficerRequest {

    @NotNull(message = "officerId is required")
    private UUID officerId;
}
