package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.CreateStaffRequest;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.UserDto;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.User;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Role;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.DuplicateEmailException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.InvalidRoleException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.DepartmentRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserDto createStaffUser(CreateStaffRequest request) {
        if (request.getRole() != Role.OFFICER && request.getRole() != Role.DEPT_HEAD) {
            throw new InvalidRoleException("Staff user can only be created with role OFFICER or DEPT_HEAD");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("User with email " + request.getEmail() + " already exists");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .department(department)
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.fromEntity(savedUser);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers(Role roleFilter, UUID departmentFilter) {
        List<User> users;
        if (roleFilter != null && departmentFilter != null) {
            users = userRepository.findByRoleAndDepartmentId(roleFilter, departmentFilter);
        } else if (roleFilter != null) {
            users = userRepository.findByRole(roleFilter);
        } else if (departmentFilter != null) {
            users = userRepository.findByDepartmentId(departmentFilter);
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return UserDto.fromEntity(updatedUser);
    }

    @Transactional
    public UserDto updateUserDepartment(UUID userId, UUID departmentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        user.setDepartment(department);
        User updatedUser = userRepository.save(user);
        return UserDto.fromEntity(updatedUser);
    }
}
