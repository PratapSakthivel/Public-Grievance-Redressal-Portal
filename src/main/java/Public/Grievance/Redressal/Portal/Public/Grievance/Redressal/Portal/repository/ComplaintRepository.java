package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(UUID citizenId);

    List<Complaint> findByDepartmentIdOrderByCreatedAtDesc(UUID departmentId);

    List<Complaint> findByAssignedOfficerIdOrderByCreatedAtDesc(UUID officerId);

    List<Complaint> findByCategoryAndPincodeAndStatusIn(Category category, String pincode, List<Status> statuses);
}
