package com.ems.pragathisweets.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCollectionResponse {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String coverImage;
    private String bannerImage;
    private Integer displayOrder;
    private boolean active;
    private String seoTitle;
    private String seoDescription;
    private int productCount;
    private List<ProductResponse> products;
}
