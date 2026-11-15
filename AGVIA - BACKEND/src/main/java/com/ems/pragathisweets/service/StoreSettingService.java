package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.StoreSettingDto;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.entity.StoreSetting;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import com.ems.pragathisweets.repository.StoreSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoreSettingService {

    private final StoreSettingRepository storeSettingRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public StoreSetting getOrCreateSetting() {
        return storeSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    log.info("[StoreSettingService] Initializing default boutique settings...");
                    StoreSetting defaultSetting = StoreSetting.builder().build();
                    return storeSettingRepository.save(defaultSetting);
                });
    }

    @Transactional(readOnly = true)
    public StoreSettingDto getSettings() {
        StoreSetting setting = storeSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> StoreSetting.builder().build());
        return toDto(setting);
    }

    @Transactional
    public StoreSettingDto updateSettings(StoreSettingDto dto, String updatedBy) {
        StoreSetting setting = getOrCreateSetting();

        // --- Store Identity & Concierge ---
        if (dto.getStoreName() != null) setting.setStoreName(dto.getStoreName().trim());
        if (dto.getStoreTagline() != null) setting.setStoreTagline(dto.getStoreTagline().trim());
        if (dto.getSupportEmail() != null) setting.setSupportEmail(dto.getSupportEmail().trim());
        if (dto.getSupportPhone() != null) setting.setSupportPhone(dto.getSupportPhone().trim());
        if (dto.getWhatsappNumber() != null) setting.setWhatsappNumber(dto.getWhatsappNumber().trim());
        if (dto.getStoreAddress() != null) setting.setStoreAddress(dto.getStoreAddress().trim());
        if (dto.getBusinessHours() != null) setting.setBusinessHours(dto.getBusinessHours().trim());

        // --- Tariffs & Checkout Rules ---
        if (dto.getMinimumOrderValue() != null) setting.setMinimumOrderValue(dto.getMinimumOrderValue());
        if (dto.getFreeDeliveryThreshold() != null) setting.setFreeDeliveryThreshold(dto.getFreeDeliveryThreshold());
        if (dto.getStandardDeliveryFee() != null) setting.setStandardDeliveryFee(dto.getStandardDeliveryFee());
        if (dto.getExpressDeliveryFee() != null) setting.setExpressDeliveryFee(dto.getExpressDeliveryFee());
        if (dto.getEnableCod() != null) setting.setEnableCod(dto.getEnableCod());
        if (dto.getCodMaxLimit() != null) setting.setCodMaxLimit(dto.getCodMaxLimit());
        if (dto.getEnableGuestCheckout() != null) setting.setEnableGuestCheckout(dto.getEnableGuestCheckout());

        // --- Live Operations & Store Banners ---
        if (dto.getMaintenanceMode() != null) setting.setMaintenanceMode(dto.getMaintenanceMode());
        if (dto.getMaintenanceMessage() != null) setting.setMaintenanceMessage(dto.getMaintenanceMessage().trim());
        if (dto.getAnnouncementBarEnabled() != null) setting.setAnnouncementBarEnabled(dto.getAnnouncementBarEnabled());
        if (dto.getAnnouncementText() != null) setting.setAnnouncementText(dto.getAnnouncementText().trim());
        if (dto.getAnnouncementLink() != null) setting.setAnnouncementLink(dto.getAnnouncementLink().trim());
        if (dto.getHolidayMode() != null) setting.setHolidayMode(dto.getHolidayMode());
        if (dto.getHolidayNotice() != null) setting.setHolidayNotice(dto.getHolidayNotice().trim());

        // --- Tax & Currencies ---
        if (dto.getCurrencySymbol() != null) setting.setCurrencySymbol(dto.getCurrencySymbol().trim());
        if (dto.getCurrencyCode() != null) setting.setCurrencyCode(dto.getCurrencyCode().trim());
        if (dto.getGstPercentage() != null) setting.setGstPercentage(dto.getGstPercentage());
        if (dto.getPricesIncludeTax() != null) setting.setPricesIncludeTax(dto.getPricesIncludeTax());

        // --- Real-Time Alerts & Stock ---
        if (dto.getLowStockThreshold() != null) setting.setLowStockThreshold(dto.getLowStockThreshold());
        if (dto.getEnableLowStockAlerts() != null) setting.setEnableLowStockAlerts(dto.getEnableLowStockAlerts());
        if (dto.getNotifyAdminOnNewOrder() != null) setting.setNotifyAdminOnNewOrder(dto.getNotifyAdminOnNewOrder());
        if (dto.getNotifyCustomerOnDispatch() != null) setting.setNotifyCustomerOnDispatch(dto.getNotifyCustomerOnDispatch());
        if (dto.getAdminAlertEmail() != null) setting.setAdminAlertEmail(dto.getAdminAlertEmail().trim());
        if (dto.getSoundAlertsEnabled() != null) setting.setSoundAlertsEnabled(dto.getSoundAlertsEnabled());

        setting.setUpdatedBy(updatedBy != null ? updatedBy : "ADMIN");
        setting.setUpdatedAt(LocalDateTime.now());

        StoreSetting saved = storeSettingRepository.save(setting);
        StoreSettingDto result = toDto(saved);

        // 1. Broadcast real-time update to all active admin and storefront WebSocket channels
        broadcastSettingsUpdate(result);

        // 2. Publish an AdminNotificationEvent so admin panel shows real-time toast and notification
        try {
            eventPublisher.publishEvent(new AdminNotificationEvent(
                    NotificationType.SETTINGS_UPDATED,
                    "System Settings Updated",
                    "Store settings updated (" + (saved.getMaintenanceMode() ? "Maintenance: ON" : "Live Store") + ", Free Delivery: ₹" + saved.getFreeDeliveryThreshold() + ")",
                    String.valueOf(saved.getId()),
                    "SETTING",
                    Map.of(
                            "updatedBy", setting.getUpdatedBy(),
                            "freeDeliveryThreshold", saved.getFreeDeliveryThreshold(),
                            "maintenanceMode", saved.getMaintenanceMode(),
                            "announcementBarEnabled", saved.getAnnouncementBarEnabled()
                    )
            ));
        } catch (Exception ex) {
            log.warn("[StoreSettingService] Failed to publish notification event for settings update: {}", ex.getMessage());
        }

        return result;
    }

    @Transactional
    public StoreSettingDto resetToDefaults(String updatedBy) {
        StoreSetting setting = getOrCreateSetting();

        setting.setStoreName("AGVIA Women's Wear Boutique");
        setting.setStoreTagline("Haute Couture & Heritage Silks");
        setting.setSupportEmail("care@agvia.in");
        setting.setSupportPhone("+91 90323 06961");
        setting.setWhatsappNumber("+91 90323 06961");
        setting.setStoreAddress("Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India");
        setting.setBusinessHours("10:30 AM - 8:30 PM IST (Mon - Sun)");

        setting.setMinimumOrderValue(new BigDecimal("200.00"));
        setting.setFreeDeliveryThreshold(new BigDecimal("999.00"));
        setting.setStandardDeliveryFee(new BigDecimal("50.00"));
        setting.setExpressDeliveryFee(new BigDecimal("150.00"));
        setting.setEnableCod(true);
        setting.setCodMaxLimit(new BigDecimal("25000.00"));
        setting.setEnableGuestCheckout(true);

        setting.setMaintenanceMode(false);
        setting.setMaintenanceMessage("Our boutique atelier is undergoing scheduled curation. We will resume taking orders shortly.");
        setting.setAnnouncementBarEnabled(true);
        setting.setAnnouncementText("✨ Festive Curation: Complimentary Handloom Potli with orders above ₹3,000 | Free Shipping across India on orders above ₹999");
        setting.setAnnouncementLink("/shop");
        setting.setHolidayMode(false);
        setting.setHolidayNotice("Orders placed now will be handcrafted and dispatched starting next week.");

        setting.setCurrencySymbol("₹");
        setting.setCurrencyCode("INR");
        setting.setGstPercentage(new BigDecimal("5.00"));
        setting.setPricesIncludeTax(true);

        setting.setLowStockThreshold(5);
        setting.setEnableLowStockAlerts(true);
        setting.setNotifyAdminOnNewOrder(true);
        setting.setNotifyCustomerOnDispatch(true);
        setting.setAdminAlertEmail("orders@pragathisweets.com");
        setting.setSoundAlertsEnabled(true);

        setting.setUpdatedBy(updatedBy != null ? updatedBy : "ADMIN");
        setting.setUpdatedAt(LocalDateTime.now());

        StoreSetting saved = storeSettingRepository.save(setting);
        StoreSettingDto result = toDto(saved);

        broadcastSettingsUpdate(result);

        try {
            eventPublisher.publishEvent(new AdminNotificationEvent(
                    NotificationType.SETTINGS_UPDATED,
                    "Settings Restored to Defaults",
                    "All boutique e-commerce settings were restored to default values by " + setting.getUpdatedBy(),
                    String.valueOf(saved.getId()),
                    "SETTING",
                    Map.of("action", "RESET_DEFAULTS")
            ));
        } catch (Exception e) {
            log.warn("[StoreSettingService] Failed to publish reset event: {}", e.getMessage());
        }

        return result;
    }

    private void broadcastSettingsUpdate(StoreSettingDto dto) {
        try {
            messagingTemplate.convertAndSend("/topic/admin/settings", dto);
            messagingTemplate.convertAndSend("/topic/settings", dto);
            log.info("[WebSocket] Dispatched real-time settings broadcast to /topic/admin/settings and /topic/settings");
        } catch (Exception ex) {
            log.warn("[WebSocket] Failed to broadcast real-time settings packet: {}", ex.getMessage());
        }
    }

    public StoreSettingDto toDto(StoreSetting s) {
        return StoreSettingDto.builder()
                .id(s.getId())
                .storeName(s.getStoreName())
                .storeTagline(s.getStoreTagline())
                .supportEmail(s.getSupportEmail())
                .supportPhone(s.getSupportPhone())
                .whatsappNumber(s.getWhatsappNumber())
                .storeAddress(s.getStoreAddress())
                .businessHours(s.getBusinessHours())
                .minimumOrderValue(s.getMinimumOrderValue())
                .freeDeliveryThreshold(s.getFreeDeliveryThreshold())
                .standardDeliveryFee(s.getStandardDeliveryFee())
                .expressDeliveryFee(s.getExpressDeliveryFee())
                .enableCod(s.getEnableCod())
                .codMaxLimit(s.getCodMaxLimit())
                .enableGuestCheckout(s.getEnableGuestCheckout())
                .maintenanceMode(s.getMaintenanceMode())
                .maintenanceMessage(s.getMaintenanceMessage())
                .announcementBarEnabled(s.getAnnouncementBarEnabled())
                .announcementText(s.getAnnouncementText())
                .announcementLink(s.getAnnouncementLink())
                .holidayMode(s.getHolidayMode())
                .holidayNotice(s.getHolidayNotice())
                .currencySymbol(s.getCurrencySymbol())
                .currencyCode(s.getCurrencyCode())
                .gstPercentage(s.getGstPercentage())
                .pricesIncludeTax(s.getPricesIncludeTax())
                .lowStockThreshold(s.getLowStockThreshold())
                .enableLowStockAlerts(s.getEnableLowStockAlerts())
                .notifyAdminOnNewOrder(s.getNotifyAdminOnNewOrder())
                .notifyCustomerOnDispatch(s.getNotifyCustomerOnDispatch())
                .adminAlertEmail(s.getAdminAlertEmail())
                .soundAlertsEnabled(s.getSoundAlertsEnabled())
                .updatedAt(s.getUpdatedAt())
                .updatedBy(s.getUpdatedBy())
                .build();
    }
}
