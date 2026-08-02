package com.grievance.repository;

import com.grievance.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    Optional<Department> findByName(String name);
    
    boolean existsByName(String name);
    
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.officers WHERE d.id = :id")
    Optional<Department> findByIdWithOfficers(@Param("id") Long id);
    
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.deptHead")
    List<Department> findAllWithDeptHead();
}
