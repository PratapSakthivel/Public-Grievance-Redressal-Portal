package com.grievance.controller;

import com.grievance.dto.AnalyticsDTO;
import com.grievance.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/global")
    public ResponseEntity<AnalyticsDTO> getGlobalStats() {
        return ResponseEntity.ok(analyticsService.getGlobalStats());
    }
    
    @GetMapping("/department/{id}")
    public ResponseEntity<AnalyticsDTO> getDepartmentStats(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.getDepartmentStats(id));
    }
}
