package com.grievance.repository;

import com.grievance.entity.Complaint;
import com.grievance.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);
    
    List<Complaint> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);
    
    List<Complaint> findByAssignedOfficerIdOrderByCreatedAtDesc(Long officerId);
    
    @Query("SELECT c FROM Complaint c WHERE c.status IN :statuses AND c.department.id = :deptId ORDER BY c.createdAt DESC")
    List<Complaint> findByDepartmentAndStatuses(@Param("deptId") Long deptId, @Param("statuses") List<ComplaintStatus> statuses);
    
    @Query("SELECT c FROM Complaint c WHERE c.status != :status ORDER BY c.createdAt DESC")
    List<Complaint> findAllExceptStatus(@Param("status") ComplaintStatus status);
    
    @Query("SELECT c FROM Complaint c WHERE c.category = :category AND c.pincode = :pincode AND c.status NOT IN (:closedStatuses)")
    List<Complaint> findSimilarOpenComplaints(
            @Param("category") String category,
            @Param("pincode") String pincode,
            @Param("closedStatuses") List<ComplaintStatus> closedStatuses);
    
    @Query("SELECT c FROM Complaint c WHERE " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:pincode IS NULL OR c.pincode = :pincode) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:departmentId IS NULL OR c.department.id = :departmentId) " +
           "ORDER BY c.createdAt DESC")
    Page<Complaint> findWithFilters(
            @Param("category") String category,
            @Param("pincode") String pincode,
            @Param("status") ComplaintStatus status,
            @Param("departmentId") Long departmentId,
            Pageable pageable);
    
    @Modifying
    @Query("UPDATE Complaint c SET c.upvoteCount = c.upvoteCount + 1 WHERE c.id = :id")
    void incrementUpvoteCount(@Param("id") Long id);
    
    @Modifying
    @Query("UPDATE Complaint c SET c.upvoteCount = c.upvoteCount - 1 WHERE c.id = :id")
    void decrementUpvoteCount(@Param("id") Long id);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :deptId")
    Long countByDepartment(@Param("deptId") Long deptId);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status")
    Long countByStatus(@Param("status") ComplaintStatus status);
    
    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category")
    List<Object[]> countByCategory();
    
    @Query("SELECT c.pincode, COUNT(c) FROM Complaint c GROUP BY c.pincode ORDER BY COUNT(c) DESC")
    List<Object[]> countByPincodeTop(Pageable pageable);
    
    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', c.createdAt), COUNT(c) FROM Complaint c WHERE c.createdAt >= :since GROUP BY FUNCTION('DATE_TRUNC', 'month', c.createdAt) ORDER BY 1")
    List<Object[]> countMonthlyTrend(@Param("since") LocalDateTime since);
    
    @Query("SELECT c.department.name, COUNT(c) FROM Complaint c GROUP BY c.department.name")
    List<Object[]> countByDepartment();
    
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (cu.created_at - c.created_at))/3600) " +
                   "FROM complaints c JOIN complaint_updates cu ON cu.complaint_id = c.id " +
                   "WHERE cu.new_status = 'RESOLVED'", nativeQuery = true)
    Double averageResolutionTimeHours();
}
