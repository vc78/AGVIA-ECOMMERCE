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
    private long purchases;

    private double visitorsToViewsPct;
    private double viewsToCartPct;
    private double cartToCheckoutsPct;
    private double checkoutsToPurchasesPct;
    private double overallConversionPct;
}
