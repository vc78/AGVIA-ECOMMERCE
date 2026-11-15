package com.ems.pragathisweets.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequestResponse {

    private Long id;
    private String returnNumber;
    private Long orderId;
    private String orderNumber;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long orderItemId;
    private String orderItemName;
    private String orderItemSku;
    private String orderItemImageUrl;
    private BigDecimal orderItemPrice;
    private Integer orderItemQuantity;
    private String type;
    private String reason;
    private String resolution;
    private String status;
    private String targetSize;
    private String targetColor;
    private Long targetVariantId;
    private String customerNotes;
    private List<String> images;
    private String bankDetails;
    private String pickupAddress;
    private String reverseCourierPartner;
    private String reverseTrackingNumber;
    private String creditCouponCode;
    private BigDecimal refundAmount;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
