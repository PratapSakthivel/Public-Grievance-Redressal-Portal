package com.grievance.dto;

import com.grievance.enums.ComplaintStatus;
import lombok.Data;

@Data
public class ComplaintUpdateRequest {
    
    private ComplaintStatus newStatus;
    
    private String remarks;
    
    private Long assignedOfficerId;
}
