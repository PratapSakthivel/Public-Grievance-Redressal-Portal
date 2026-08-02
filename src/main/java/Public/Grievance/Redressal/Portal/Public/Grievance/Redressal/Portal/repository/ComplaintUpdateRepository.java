package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.ComplaintUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ComplaintUpdateRepository extends JpaRepository<ComplaintUpdate, UUID> {
}
