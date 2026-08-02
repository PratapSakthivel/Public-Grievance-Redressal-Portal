package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Complaint;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Category;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID>, JpaSpecificationExecutor<Complaint> {

    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(UUID citizenId);

    List<Complaint> findByDepartmentIdOrderByCreatedAtDesc(UUID departmentId);

    List<Complaint> findByAssignedOfficerIdOrderByCreatedAtDesc(UUID officerId);

    List<Complaint> findByCategoryAndPincodeAndStatusIn(Category category, String pincode, List<Status> statuses);

    // ─── Analytics: Status Breakdown ─────────────────────────────────────────

    @Query(value = """
            SELECT c.status::text, COUNT(*) AS count
            FROM complaints c
            WHERE (:departmentId IS NULL OR c.department_id = CAST(:departmentId AS uuid))
            GROUP BY c.status
            ORDER BY count DESC
            """, nativeQuery = true)
    List<Object[]> getStatusBreakdownRaw(@Param("departmentId") String departmentId);

    // ─── Analytics: Category Breakdown ───────────────────────────────────────

    @Query(value = """
            SELECT c.category::text, COUNT(*) AS count
            FROM complaints c
            WHERE (:departmentId IS NULL OR c.department_id = CAST(:departmentId AS uuid))
            GROUP BY c.category
            ORDER BY count DESC
            """, nativeQuery = true)
    List<Object[]> getCategoryBreakdownRaw(@Param("departmentId") String departmentId);

    // ─── Analytics: Top Pincodes ──────────────────────────────────────────────

    @Query(value = """
            SELECT c.pincode, COUNT(*) AS count
            FROM complaints c
            GROUP BY c.pincode
            ORDER BY count DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> getTopPincodesRaw(@Param("limit") int limit);

    // ─── Analytics: Volume Trend (last 30 days) ───────────────────────────────

    @Query(value = """
            SELECT DATE_TRUNC('day', c.created_at)::date AS day, COUNT(*) AS count
            FROM complaints c
            WHERE c.created_at >= :since
              AND (:departmentId IS NULL OR c.department_id = CAST(:departmentId AS uuid))
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> getVolumeTrendRaw(@Param("since") Instant since,
                                     @Param("departmentId") String departmentId);

    // ─── Analytics: Resolved Count ────────────────────────────────────────────

    @Query(value = """
            SELECT COUNT(*)
            FROM complaints c
            WHERE c.status IN ('RESOLVED', 'CLOSED')
              AND (:departmentId IS NULL OR c.department_id = CAST(:departmentId AS uuid))
            """, nativeQuery = true)
    long getResolvedCount(@Param("departmentId") String departmentId);

    // ─── Analytics: Total Count ───────────────────────────────────────────────

    @Query(value = """
            SELECT COUNT(*)
            FROM complaints c
            WHERE (:departmentId IS NULL OR c.department_id = CAST(:departmentId AS uuid))
            """, nativeQuery = true)
    long getTotalCount(@Param("departmentId") String departmentId);

    // ─── Analytics: Avg Resolution Time (hours) ───────────────────────────────
    // Approximation: uses updated_at as proxy for resolved_at.
    // Returns null when no RESOLVED/CLOSED complaints exist for the filter.

    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600.0)
            FROM complaints c
            WHERE c.status IN ('RESOLVED', 'CLOSED')
              AND (:departmentId IS NULL OR c.department_id = CAST(:departmentId AS uuid))
            """, nativeQuery = true)
    Double getAvgResolutionTimeHours(@Param("departmentId") String departmentId);
}
