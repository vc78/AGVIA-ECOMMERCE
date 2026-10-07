package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.HomepageDataResponse;
import com.ems.pragathisweets.service.MerchandisingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/homepage")
@RequiredArgsConstructor
public class HomepageController {

    private final MerchandisingService merchandisingService;

    @GetMapping
    public ResponseEntity<ApiResponse<HomepageDataResponse>> getHomepageData() {
        HomepageDataResponse data = merchandisingService.getAggregatedHomepageData();
        return ResponseEntity.ok(ApiResponse.ok("Homepage data loaded successfully", data));
    }
}
