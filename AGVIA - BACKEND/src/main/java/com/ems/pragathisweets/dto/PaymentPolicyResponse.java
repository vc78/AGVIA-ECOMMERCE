package com.ems.pragathisweets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPolicyResponse {
    private String paymentMode; // "COD_ONLY", "ONLINE_ONLY", "COD_AND_ONLINE", "CONFLICT"
    private boolean codAllowed;
    private boolean onlineAllowed;
    private boolean conflict;
    private String message;
    private String reasonCode; // "OK", "COD_ONLY_ITEMS", "ONLINE_ONLY_ITEMS", "PAYMENT_CONFLICT"
}
