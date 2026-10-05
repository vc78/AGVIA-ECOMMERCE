package com.ems.pragathisweets.event;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Event published when an order is authoritatively confirmed in MySQL
 * (either COD at checkout or online upon payment signature verification,
 * or upon admin status transition).
 */
@Getter
@RequiredArgsConstructor
public class OrderConfirmedEvent {
    private final Long orderId;
    private final String orderNumber;
    private final String source; // COD, ONLINE, ADMIN_STATUS_UPDATE, REGENERATE
}
