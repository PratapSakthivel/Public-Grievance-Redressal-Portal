package com.grievance.dto;

import com.grievance.enums.ComplaintStatus;
import com.grievance.enums.Priority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ComplaintResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String pincode;
    private String areaName;
    private ComplaintStatus status;
    private Priority priority;
    private Integer upvoteCount;
    private Boolean hasUpvoted;
    private Long citizenId;
    private String citizenName;
    private Long departmentId;
    private String departmentName;
    private Long assignedOfficerId;
    private String assignedOfficerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TimelineEntry> timeline;
}
