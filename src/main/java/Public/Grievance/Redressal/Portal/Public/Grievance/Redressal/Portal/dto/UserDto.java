package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    private String name;
    private String email;
    private Role role;
    private UUID departmentId;

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .build();
    }
}
