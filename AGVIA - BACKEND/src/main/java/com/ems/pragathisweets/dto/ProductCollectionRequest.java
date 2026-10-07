package com.ems.pragathisweets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCollectionRequest {

    @NotBlank(message = "Collection name is required")
    private String name;

    private String slug;

    private String description;

    private String coverImage;

    private String bannerImage;

    private Integer displayOrder;

    private Boolean active;

    private String seoTitle;

    private String seoDescription;

    private List<Long> productIds;
}
