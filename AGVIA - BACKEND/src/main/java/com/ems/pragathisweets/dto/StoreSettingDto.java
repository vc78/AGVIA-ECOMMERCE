package com.ems.pragathisweets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettingDto {

    private Long id;

    // --- Store Identity & Concierge ---
    private String storeName;
    private String storeTagline;
    private String supportEmail;
    private String supportPhone;
    private String whatsappNumber;
    private String storeAddress;
    private String businessHours;

    // --- Tariffs & Checkout Rules ---
    private BigDecimal minimumOrderValue;
    private BigDecimal freeDeliveryThreshold;
    private BigDecimal standardDeliveryFee;
    private BigDecimal expressDeliveryFee;
    private Boolean enableCod;
    private BigDecimal codMaxLimit;
    private Boolean enableGuestCheckout;

    // --- Live Operations & Store Banners ---
    private Boolean maintenanceMode;
    private String maintenanceMessage;
    private Boolean announcementBarEnabled;
    private String announcementText;
    private String announcementLink;
    private Boolean holidayMode;
    private String holidayNotice;

    // --- Tax & Currencies ---
    private String currencySymbol;
    private String currencyCode;
    private BigDecimal gstPercentage;
    private Boolean pricesIncludeTax;

    // --- Real-Time Alerts & Stock ---
    private Integer lowStockThreshold;
    private Boolean enableLowStockAlerts;
    private Boolean notifyAdminOnNewOrder;
    private Boolean notifyCustomerOnDispatch;
    private String adminAlertEmail;
    private Boolean soundAlertsEnabled;

    // --- Audit ---
    private LocalDateTime updatedAt;
    private String updatedBy;
}
