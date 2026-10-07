package com.ems.pragathisweets.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantImageDto {
    private Long id;
    private String imageUrl;
    private String altText;
    private Integer sortOrder;
    private boolean isPrimary;
}
