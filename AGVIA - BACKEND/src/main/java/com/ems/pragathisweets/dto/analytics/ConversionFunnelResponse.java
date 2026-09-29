package com.ems.pragathisweets.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversionFunnelResponse {
    private long visitors;
    private long productViews;
    private long addToCart;
    private long checkouts;
    private long checkoutStarted;
    private long purchases;

    private double visitorsToViewsPct;
    private double productViewRate;
    private double viewsToCartPct;
    private double cartRate;
    private double cartToCheckoutsPct;
    private double checkoutRate;
    private double checkoutsToPurchasesPct;
    private double purchaseRate;
    private double overallConversionPct;
    private double overallConversionRate;
}
