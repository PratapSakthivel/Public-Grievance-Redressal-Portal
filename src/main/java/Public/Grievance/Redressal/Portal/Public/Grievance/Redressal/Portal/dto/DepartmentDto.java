package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDto {

    private UUID id;
    private String name;
    private String description;
    private UUID deptHeadId;
    private String deptHeadName;

    public static DepartmentDto fromEntity(Department department) {
        return DepartmentDto.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .deptHeadId(department.getDeptHead() != null ? department.getDeptHead().getId() : null)
                .deptHeadName(department.getDeptHead() != null ? department.getDeptHead().getName() : null)
                .build();
    }
}
