package com.ems.pragathisweets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageSectionRequest {

    @NotBlank(message = "Section key is required")
    private String sectionKey;

    @NotBlank(message = "Title is required")
    private String title;

    private String subtitle;

    private Integer displayOrder;

    private Boolean active;

    private Boolean automatic;

    private Integer maxItems;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private String customProductIds;

    private Long collectionId;
}
