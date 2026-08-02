package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.util;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CategoryDepartmentMapper {

    private final DepartmentRepository departmentRepository;

    public String getDepartmentNameForCategory(Category category) {
        if (category == null) {
            return "Other";
        }
        return switch (category) {
            case WATER -> "Water";
            case ROADS -> "Roads";
            case ELECTRICITY -> "Electricity";
            case SANITATION -> "Sanitation";
            case PUBLIC_HEALTH -> "Public Health";
            case OTHER -> "Other";
        };
    }

    public Department getDepartmentForCategory(Category category) {
        String departmentName = getDepartmentNameForCategory(category);
        return departmentRepository.findByName(departmentName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department '" + departmentName + "' for category '" + category + "' is not configured. Please contact Super Admin."
                ));
    }
}
