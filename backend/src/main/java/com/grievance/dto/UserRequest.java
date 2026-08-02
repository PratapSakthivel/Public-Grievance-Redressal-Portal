package com.grievance.dto;

import com.grievance.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email
    private String email;
    
    private String password; // optional for edit but required for create (handled in service)
    
    @NotNull(message = "Role is required")
    private Role role;
    
    private Long departmentId;
}
