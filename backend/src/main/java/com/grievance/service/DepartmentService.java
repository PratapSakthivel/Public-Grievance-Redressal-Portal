package com.grievance.service;

import com.grievance.dto.DepartmentRequest;
import com.grievance.entity.Department;
import com.grievance.entity.User;
import com.grievance.enums.Role;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    
    public List<Department> getAllDepartments() {
        return departmentRepository.findAllWithDeptHead();
    }
    
    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
    }
    
    @Transactional
    public Department createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Department name already exists");
        }
        
        User deptHead = null;
        if (request.getDeptHeadId() != null) {
            deptHead = userRepository.findById(request.getDeptHeadId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getDeptHeadId()));
            // Upgrade role to DEPT_HEAD if needed
            deptHead.setRole(Role.DEPT_HEAD);
        }
        
        Department department = Department.builder()
            .name(request.getName())
            .description(request.getDescription())
            .deptHead(deptHead)
            .build();
            
        Department saved = departmentRepository.save(department);
        
        if (deptHead != null) {
            deptHead.setDepartment(saved);
            userRepository.save(deptHead);
        }
        
        return saved;
    }
    
    @Transactional
    public Department updateDepartment(Long id, DepartmentRequest request) {
        Department department = getDepartmentById(id);
        
        if (!department.getName().equals(request.getName()) && departmentRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Department name already exists");
        }
        
        User oldHead = department.getDeptHead();
        User newHead = null;
        
        if (request.getDeptHeadId() != null) {
            newHead = userRepository.findById(request.getDeptHeadId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getDeptHeadId()));
            newHead.setRole(Role.DEPT_HEAD);
            newHead.setDepartment(department);
            userRepository.save(newHead);
        }
        
        // If the head has changed, set the old head's role back to OFFICER or CITIZEN depending on choice
        if (oldHead != null && (newHead == null || !oldHead.getId().equals(newHead.getId()))) {
            oldHead.setRole(Role.OFFICER); // Default to Officer if demoted
            userRepository.save(oldHead);
        }
        
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setDeptHead(newHead);
        
        return departmentRepository.save(department);
    }
    
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);
        
        // Remove department reference from users
        for (User officer : department.getOfficers()) {
            officer.setDepartment(null);
            userRepository.save(officer);
        }
        if (department.getDeptHead() != null) {
            department.getDeptHead().setDepartment(null);
            userRepository.save(department.getDeptHead());
        }
        
        departmentRepository.delete(department);
    }
}
