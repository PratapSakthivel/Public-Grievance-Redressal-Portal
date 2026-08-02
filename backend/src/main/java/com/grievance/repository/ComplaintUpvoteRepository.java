package com.grievance.repository;

import com.grievance.entity.ComplaintUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplaintUpvoteRepository extends JpaRepository<ComplaintUpvote, Long> {
    
    Optional<ComplaintUpvote> findByComplaintIdAndCitizenId(Long complaintId, Long citizenId);
    
    boolean existsByComplaintIdAndCitizenId(Long complaintId, Long citizenId);
    
    Long countByComplaintId(Long complaintId);
}
