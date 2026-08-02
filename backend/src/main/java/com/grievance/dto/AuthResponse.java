package com.grievance.dto;

import com.grievance.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private Long departmentId;
    private String departmentName;
}
