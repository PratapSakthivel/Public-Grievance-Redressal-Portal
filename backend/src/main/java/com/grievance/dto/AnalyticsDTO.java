package com.grievance.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsDTO {
    private Long totalComplaints;
    private Long resolvedComplaints;
    private Long pendingComplaints;
    private Map<String, Long> statusBreakdown;
    private Map<String, Long> categoryDistribution;
    private List<PincodeStat> topPincodes;
    private List<MonthlyTrend> monthlyTrends;
    private Map<String, Long> departmentComparison;
    private Double averageResolutionTime;
    
    @Data
    @Builder
    public static class PincodeStat {
        private String pincode;
        private Long count;
        private String areaName;
    }
    
    @Data
    @Builder
    public static class MonthlyTrend {
        private String month;
        private Long filed;
        private Long resolved;
    }
}
