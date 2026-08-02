package com.grievance.dto;

import com.grievance.enums.ComplaintStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TimelineEntry {
    private Long id;
    private ComplaintStatus oldStatus;
    private ComplaintStatus newStatus;
    private String remarks;
    private Long actorId;
    private String actorName;
    private String actorRole;
    private LocalDateTime createdAt;
}
