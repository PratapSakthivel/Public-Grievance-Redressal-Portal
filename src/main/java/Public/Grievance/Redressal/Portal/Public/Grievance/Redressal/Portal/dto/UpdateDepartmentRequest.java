package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDepartmentRequest {

    @NotNull(message = "Department ID is required")
    private UUID departmentId;
}
