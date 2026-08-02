package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;
}
