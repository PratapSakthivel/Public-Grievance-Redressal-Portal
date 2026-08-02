package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.ComplaintUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComplaintUpvoteRepository extends JpaRepository<ComplaintUpvote, UUID> {

    boolean existsByComplaintIdAndCitizenId(UUID complaintId, UUID citizenId);

    Optional<ComplaintUpvote> findByComplaintIdAndCitizenId(UUID complaintId, UUID citizenId);
}
