package com.grievance.repository;

import com.grievance.entity.ComplaintUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintUpdateRepository extends JpaRepository<ComplaintUpdate, Long> {
    
    List<ComplaintUpdate> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);
    
    @Query("SELECT cu FROM ComplaintUpdate cu JOIN FETCH cu.actor WHERE cu.complaint.id = :complaintId ORDER BY cu.createdAt DESC")
    List<ComplaintUpdate> findByComplaintIdWithActor(@Param("complaintId") Long complaintId);
}
