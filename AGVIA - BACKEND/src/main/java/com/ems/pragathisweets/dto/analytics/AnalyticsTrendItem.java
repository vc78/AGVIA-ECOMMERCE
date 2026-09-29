package com.ems.pragathisweets.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsTrendItem {
    private String date; // YYYY-MM-DD
    private long visitors;
    private long pageViews;
    private long productViews;
    private long addToCart;
    private long checkouts;
    private long orders;
    private BigDecimal revenue;
}
