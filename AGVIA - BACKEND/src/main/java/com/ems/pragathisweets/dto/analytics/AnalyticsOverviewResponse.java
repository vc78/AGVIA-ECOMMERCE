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
public class AnalyticsOverviewResponse {
    private long visitors;
    private long sessions;
    private long pageViews;
    private long productViews;
    private long addToCart;
    private long shares;
    private long checkouts;
    private long orders;
    private BigDecimal revenue;

    private double viewToCartPct;
    private double cartToCheckoutPct;
    private double checkoutToOrderPct;
    private double overallConversionPct;
}
