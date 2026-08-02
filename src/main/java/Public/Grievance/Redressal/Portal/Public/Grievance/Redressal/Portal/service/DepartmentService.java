package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.DepartmentDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.DepartmentRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.DuplicateResourceException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.DepartmentRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public DepartmentDto createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Department with name '" + request.getName() + "' already exists");
        }

        Department department = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Department savedDepartment = departmentRepository.save(department);
        return DepartmentDto.fromEntity(savedDepartment);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(DepartmentDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto updateDepartment(UUID id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        if (!department.getName().equalsIgnoreCase(request.getName()) && departmentRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Department with name '" + request.getName() + "' already exists");
        }

        department.setName(request.getName());
        department.setDescription(request.getDescription());

        Department updatedDepartment = departmentRepository.save(department);
        return DepartmentDto.fromEntity(updatedDepartment);
    }

    @Transactional
    public DepartmentDto assignHead(UUID departmentId, UUID userId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Promote to DEPT_HEAD if not already, and set their department
        if (user.getRole() != Role.DEPT_HEAD) {
            user.setRole(Role.DEPT_HEAD);
        }
        user.setDepartment(department);
        userRepository.save(user);

        department.setDeptHead(user);
        Department updatedDepartment = departmentRepository.save(department);

        return DepartmentDto.fromEntity(updatedDepartment);
    }
}
