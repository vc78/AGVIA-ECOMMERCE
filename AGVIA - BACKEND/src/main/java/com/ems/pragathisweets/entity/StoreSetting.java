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

    // --- Store Identity & Concierge ---
    @Column(name = "store_name", nullable = false)
    @Builder.Default
    private String storeName = "AGVIA Women's Wear Boutique";

    @Column(name = "store_tagline")
    @Builder.Default
    private String storeTagline = "Haute Couture & Heritage Silks";

    @Column(name = "support_email")
    @Builder.Default
    private String supportEmail = "care@agvia.in";

    @Column(name = "support_phone")
    @Builder.Default
    private String supportPhone = "+91 90323 06961";

    @Column(name = "whatsapp_number")
    @Builder.Default
    private String whatsappNumber = "+91 90323 06961";

    @Column(name = "store_address", length = 500)
    @Builder.Default
    private String storeAddress = "Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India";

    @Column(name = "business_hours")
    @Builder.Default
    private String businessHours = "10:30 AM - 8:30 PM IST (Mon - Sun)";

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
    private String maintenanceMessage = "Our boutique atelier is undergoing scheduled curation. We will resume taking orders shortly.";

    @Column(name = "announcement_bar_enabled")
    @Builder.Default
    private Boolean announcementBarEnabled = true;

    @Column(name = "announcement_text", length = 1000)
    @Builder.Default
    private String announcementText = "✨ Festive Curation: Complimentary Handloom Potli with orders above ₹3,000 | Free Shipping across India on orders above ₹999";

    @Column(name = "announcement_link")
    @Builder.Default
    private String announcementLink = "/shop";

    @Column(name = "holiday_mode")
    @Builder.Default
    private Boolean holidayMode = false;

    @Column(name = "holiday_notice", length = 1000)
    @Builder.Default
    private String holidayNotice = "Orders placed now will be handcrafted and dispatched starting next week.";

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
    private String adminAlertEmail = "orders@pragathisweets.com";

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
