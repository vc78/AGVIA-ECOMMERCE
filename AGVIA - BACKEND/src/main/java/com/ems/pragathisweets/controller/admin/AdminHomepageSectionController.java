package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.HomepageSectionRequest;
import com.ems.pragathisweets.dto.HomepageSectionResponse;
import com.ems.pragathisweets.entity.HomepageSection;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.HomepageSectionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/homepage-sections")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHomepageSectionController {

    private final HomepageSectionRepository homepageSectionRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HomepageSectionResponse>>> getAllSections() {
        List<HomepageSectionResponse> list = homepageSectionRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Homepage sections retrieved", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HomepageSectionResponse>> createSection(@Valid @RequestBody HomepageSectionRequest request) {
        HomepageSection section = HomepageSection.builder()
                .sectionKey(request.getSectionKey())
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() == null || request.getActive())
                .automatic(request.getAutomatic() == null || request.getAutomatic())
                .maxItems(request.getMaxItems() != null ? request.getMaxItems() : 8)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .customProductIds(request.getCustomProductIds())
                .collectionId(request.getCollectionId())
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Section created", toResponse(homepageSectionRepository.save(section))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HomepageSectionResponse>> updateSection(@PathVariable Long id, @Valid @RequestBody HomepageSectionRequest request) {
        HomepageSection section = homepageSectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found with id: " + id));

        section.setSectionKey(request.getSectionKey());
        section.setTitle(request.getTitle());
        section.setSubtitle(request.getSubtitle());
        if (request.getDisplayOrder() != null) section.setDisplayOrder(request.getDisplayOrder());
        if (request.getActive() != null) section.setActive(request.getActive());
        if (request.getAutomatic() != null) section.setAutomatic(request.getAutomatic());
        if (request.getMaxItems() != null) section.setMaxItems(request.getMaxItems());
        section.setStartDate(request.getStartDate());
        section.setEndDate(request.getEndDate());
        section.setCustomProductIds(request.getCustomProductIds());
        section.setCollectionId(request.getCollectionId());

        return ResponseEntity.ok(ApiResponse.ok("Section updated", toResponse(homepageSectionRepository.save(section))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable Long id) {
        if (!homepageSectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Section not found with id: " + id);
        }
        homepageSectionRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Section deleted successfully", null));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderSections(@RequestBody List<Map<String, Object>> reorderList) {
        for (Map<String, Object> item : reorderList) {
            Number idNum = (Number) item.get("id");
            Number orderNum = (Number) item.get("displayOrder");
            if (idNum != null && orderNum != null) {
                homepageSectionRepository.findById(idNum.longValue()).ifPresent(s -> {
                    s.setDisplayOrder(orderNum.intValue());
                    homepageSectionRepository.save(s);
                });
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Section order updated successfully", null));
    }

    private HomepageSectionResponse toResponse(HomepageSection s) {
        return HomepageSectionResponse.builder()
                .id(s.getId())
                .sectionKey(s.getSectionKey())
                .title(s.getTitle())
                .subtitle(s.getSubtitle())
                .displayOrder(s.getDisplayOrder())
                .active(s.isActive())
                .automatic(s.isAutomatic())
                .maxItems(s.getMaxItems())
                .startDate(s.getStartDate())
                .endDate(s.getEndDate())
                .customProductIds(s.getCustomProductIds())
                .collectionId(s.getCollectionId())
                .build();
    }
}
