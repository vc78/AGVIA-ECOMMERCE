package com.ems.pragathisweets.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageSectionResponse {

    private Long id;
    private String sectionKey;
    private String title;
    private String subtitle;
    private Integer displayOrder;
    private boolean active;
    private boolean automatic;
    private Integer maxItems;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String customProductIds;
    private Long collectionId;
}
