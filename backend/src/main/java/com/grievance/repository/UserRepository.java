package com.grievance.repository;

import com.grievance.entity.User;
import com.grievance.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<User> findByRole(Role role);
    
    List<User> findByDepartmentIdAndRole(Long departmentId, Role role);
    
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.department.id = :deptId")
    List<User> findOfficersByDepartment(@Param("deptId") Long departmentId, @Param("role") Role role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    Long countByRole(@Param("role") Role role);
}
