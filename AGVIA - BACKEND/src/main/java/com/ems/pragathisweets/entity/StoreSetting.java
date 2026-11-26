package com.ems.pragathisweets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Store Identity & Contact ---
    @Column(name = "store_name", nullable = false)
    @Builder.Default
    private String storeName = "Lokesh Lingam Weaver";

    @Column(name = "store_tagline")
    @Builder.Default
    private String storeTagline = "Handloom Sarees & Traditional Weaves";

    @Column(name = "support_email")
    @Builder.Default
    private String supportEmail = "";

    @Column(name = "support_phone")
    @Builder.Default
    private String supportPhone = "+91 7799349294";

    @Column(name = "whatsapp_number")
    @Builder.Default
    private String whatsappNumber = "+91 7799349294";

    @Column(name = "store_address", length = 500)
    @Builder.Default
    private String storeAddress = "Dharmavaram, Andhra Pradesh, India – 515671";

    @Column(name = "business_hours")
    @Builder.Default
    private String businessHours = "";

    // --- Tariffs & Checkout Rules ---
    @Column(name = "minimum_order_value", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minimumOrderValue = new BigDecimal("200.00");

    @Column(name = "free_delivery_threshold", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal freeDeliveryThreshold = new BigDecimal("999.00");

    @Column(name = "standard_delivery_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal standardDeliveryFee = new BigDecimal("50.00");

    @Column(name = "express_delivery_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal expressDeliveryFee = new BigDecimal("150.00");

    @Column(name = "enable_cod")
    @Builder.Default
    private Boolean enableCod = true;

    @Column(name = "cod_max_limit", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal codMaxLimit = new BigDecimal("25000.00");

    @Column(name = "enable_guest_checkout")
    @Builder.Default
    private Boolean enableGuestCheckout = true;

    // --- Live Operations & Store Banners ---
    @Column(name = "maintenance_mode")
    @Builder.Default
    private Boolean maintenanceMode = false;

    @Column(name = "maintenance_message", length = 1000)
    @Builder.Default
    private String maintenanceMessage = "Our store is undergoing scheduled updates. Please contact us on WhatsApp (+91 7799349294) for enquiries.";

    @Column(name = "announcement_bar_enabled")
    @Builder.Default
    private Boolean announcementBarEnabled = false;

    @Column(name = "announcement_text", length = 1000)
    @Builder.Default
    private String announcementText = "";

    @Column(name = "announcement_link")
    @Builder.Default
    private String announcementLink = "/products";

    @Column(name = "holiday_mode")
    @Builder.Default
    private Boolean holidayMode = false;

    @Column(name = "holiday_notice", length = 1000)
    @Builder.Default
    private String holidayNotice = "Dispatch updates will be confirmed via WhatsApp (+91 7799349294).";

    // --- Tax & Currencies ---
    @Column(name = "currency_symbol", length = 10)
    @Builder.Default
    private String currencySymbol = "₹";

    @Column(name = "currency_code", length = 10)
    @Builder.Default
    private String currencyCode = "INR";

    @Column(name = "gst_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal gstPercentage = new BigDecimal("5.00");

    @Column(name = "prices_include_tax")
    @Builder.Default
    private Boolean pricesIncludeTax = true;

    // --- Real-Time Alerts & Stock ---
    @Column(name = "low_stock_threshold")
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Column(name = "enable_low_stock_alerts")
    @Builder.Default
    private Boolean enableLowStockAlerts = true;

    @Column(name = "notify_admin_on_new_order")
    @Builder.Default
    private Boolean notifyAdminOnNewOrder = true;

    @Column(name = "notify_customer_on_dispatch")
    @Builder.Default
    private Boolean notifyCustomerOnDispatch = true;

    @Column(name = "admin_alert_email")
    @Builder.Default
    private String adminAlertEmail = "";

    @Column(name = "sound_alerts_enabled")
    @Builder.Default
    private Boolean soundAlertsEnabled = true;

    // --- Audit ---
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
