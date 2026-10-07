package com.ems.pragathisweets.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageDataResponse {

    private List<HomepageSectionResponse> sections;
    private List<ProductResponse> bestSellers;
    private List<ProductResponse> trending;
    private List<ProductResponse> newArrivals;
    private List<ProductResponse> limitedStock;
    private List<ProductResponse> featured;
    private List<ProductCollectionResponse> collections;
    private List<ColorSwatchDto> colors;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ColorSwatchDto {
        private String colorName;
        private String colorCode;
        private int productCount;
    }
}
