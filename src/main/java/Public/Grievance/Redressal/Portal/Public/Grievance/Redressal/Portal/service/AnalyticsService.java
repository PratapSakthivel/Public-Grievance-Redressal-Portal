package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.service;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.dto.*;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.Department;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.exception.ResourceNotFoundException;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.ComplaintRepository;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;

    // ─── Department-scoped Analytics ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public DepartmentAnalyticsResponse getDepartmentAnalytics(UUID departmentId) {
        // Verify department exists
        departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        String deptIdStr = departmentId.toString();
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);

        List<StatusBreakdownDto> statusBreakdown = mapStatusBreakdown(
                complaintRepository.getStatusBreakdownRaw(deptIdStr));

        List<CategoryBreakdownDto> categoryBreakdown = mapCategoryBreakdown(
                complaintRepository.getCategoryBreakdownRaw(deptIdStr));

        List<VolumeTrendDto> volumeTrend = mapVolumeTrend(
                complaintRepository.getVolumeTrendRaw(since, deptIdStr));

        long total = complaintRepository.getTotalCount(deptIdStr);
        long resolved = complaintRepository.getResolvedCount(deptIdStr);
        Double avgHours = complaintRepository.getAvgResolutionTimeHours(deptIdStr);

        return DepartmentAnalyticsResponse.builder()
                .statusBreakdown(statusBreakdown)
                .categoryBreakdown(categoryBreakdown)
                .volumeTrend(volumeTrend)
                .totalComplaints(total)
                .resolvedCount(resolved)
                .avgResolutionTimeHours(avgHours)
                .build();
    }

    // ─── Global Analytics ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GlobalAnalyticsResponse getGlobalAnalytics() {
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);

        List<StatusBreakdownDto> statusBreakdown = mapStatusBreakdown(
                complaintRepository.getStatusBreakdownRaw(null));

        List<CategoryBreakdownDto> categoryBreakdown = mapCategoryBreakdown(
                complaintRepository.getCategoryBreakdownRaw(null));

        List<PincodeBreakdownDto> pincodeBreakdown = complaintRepository.getTopPincodesRaw(10).stream()
                .map(row -> new PincodeBreakdownDto(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<VolumeTrendDto> volumeTrend = mapVolumeTrend(
                complaintRepository.getVolumeTrendRaw(since, null));

        long total = complaintRepository.getTotalCount(null);
        long resolved = complaintRepository.getResolvedCount(null);
        Double avgHours = complaintRepository.getAvgResolutionTimeHours(null);

        // Build per-department comparison — includes ALL departments, even with 0 complaints
        List<Department> allDepartments = departmentRepository.findAll();
        List<DepartmentComparisonDto> comparison = allDepartments.stream()
                .map(dept -> {
                    String deptIdStr = dept.getId().toString();
                    long deptTotal = complaintRepository.getTotalCount(deptIdStr);
                    long deptResolved = complaintRepository.getResolvedCount(deptIdStr);
                    Double deptAvg = complaintRepository.getAvgResolutionTimeHours(deptIdStr);
                    return DepartmentComparisonDto.builder()
                            .departmentId(dept.getId())
                            .departmentName(dept.getName())
                            .totalComplaints(deptTotal)
                            .resolvedCount(deptResolved)
                            .avgResolutionTimeHours(deptAvg)
                            .build();
                })
                .collect(Collectors.toList());

        return GlobalAnalyticsResponse.builder()
                .statusBreakdown(statusBreakdown)
                .categoryBreakdown(categoryBreakdown)
                .pincodeBreakdown(pincodeBreakdown)
                .volumeTrend(volumeTrend)
                .totalComplaints(total)
                .resolvedCount(resolved)
                .avgResolutionTimeHours(avgHours)
                .departmentComparison(comparison)
                .build();
    }

    // ─── Private mapping helpers ──────────────────────────────────────────────

    private List<StatusBreakdownDto> mapStatusBreakdown(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new StatusBreakdownDto(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    private List<CategoryBreakdownDto> mapCategoryBreakdown(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new CategoryBreakdownDto(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    private List<VolumeTrendDto> mapVolumeTrend(List<Object[]> rows) {
        return rows.stream()
                .map(row -> {
                    LocalDate date;
                    Object dayCol = row[0];
                    if (dayCol instanceof LocalDate ld) {
                        date = ld;
                    } else if (dayCol instanceof Date sqlDate) {
                        date = sqlDate.toLocalDate();
                    } else {
                        date = LocalDate.parse(dayCol.toString().substring(0, 10));
                    }
                    return new VolumeTrendDto(date, ((Number) row[1]).longValue());
                })
                .collect(Collectors.toList());
    }
}
