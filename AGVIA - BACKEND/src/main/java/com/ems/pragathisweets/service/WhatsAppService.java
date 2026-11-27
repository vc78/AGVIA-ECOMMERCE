package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderItemResponse;
import com.ems.pragathisweets.dto.OrderResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

/**
 * WhatsApp notification service powered by Twilio's WhatsApp Business API.
 *
 * <p>Messages are sent asynchronously so the order placement flow is never blocked.
 * The service is disabled by default ({@code app.whatsapp.enabled=false}) so the
 * application runs normally in dev/CI environments without valid Twilio credentials.
 *
 * <h2>Setup (one-time, free sandbox)</h2>
 * <ol>
 *   <li>Create a free Twilio account at <a href="https://www.twilio.com">twilio.com</a></li>
 *   <li>Go to <em>Messaging → Try it out → Send a WhatsApp message</em></li>
 *   <li>Save your <strong>Account SID</strong> and <strong>Auth Token</strong></li>
 *   <li>Set the four properties below in {@code application.properties} or as env-vars</li>
 * </ol>
 */
@Service
@Slf4j
public class WhatsAppService {

    private static final String TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";
    private static final DateTimeFormatter DISPLAY_FMT =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a");

    @Value("${app.whatsapp.enabled:false}")
    private boolean enabled;

    @Value("${app.whatsapp.twilio.account-sid:}")
    private String accountSid;

    @Value("${app.whatsapp.twilio.auth-token:}")
    private String authToken;

    /** Official AGVIA WhatsApp number whatsapp:+919032306961 */
    @Value("${app.whatsapp.twilio.from-number:whatsapp:+919032306961}")
    private String fromNumber;

    private final RestTemplate restTemplate = new RestTemplate();

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────


    /**
     * Sends a direct OTP verification message to the customer's WhatsApp number.
     */
    public String sendOtp(String phone, String code) {
        String cleanPhone = normalisePhone(phone);
        String message = "🔐 *PRAGATHI SWEETS* — Verification Code\n\n"
                + "Your 6-digit verification code is: *" + code + "*\n\n"
                + "Valid for 10 minutes. Please do not share this OTP with anyone.\n"
                + "Thank you for choosing Pragathi Sweets!";
        
        if (enabled && isConfigured()) {
            send(cleanPhone, message);
        }

        String waUrl = buildDirectWhatsAppUrl(cleanPhone, message);
        log.info("[WhatsApp OTP URL] Generated click-to-chat WhatsApp link for {}: {}", cleanPhone, waUrl);
        return waUrl;
    }

    /**
     * Checks if Twilio API credentials are fully configured.
     */
    public boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank() && authToken != null && !authToken.isBlank();
    }

    /**
     * Builds a universal click-to-chat WhatsApp URL (works on mobile app and WhatsApp Web).
     */
    public String buildDirectWhatsAppUrl(String phone, String text) {
        if (phone == null || phone.isBlank()) return "";
        String cleanDigits = phone.replaceAll("[^0-9]", "");
        if (cleanDigits.length() == 10) cleanDigits = "91" + cleanDigits;
        try {
            return "https://api.whatsapp.com/send?phone=" + cleanDigits + "&text=" + java.net.URLEncoder.encode(text, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "https://api.whatsapp.com/send?phone=" + cleanDigits;
        }
    }


    // ─────────────────────────────────────────────────────────────────────────
    // HTTP Transport (Twilio REST API)
    // ─────────────────────────────────────────────────────────────────────────

    private void send(String toNumber, String message) {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            log.info("[WhatsApp Direct Notification] Message generated for customer number {}. (Twilio credentials not configured in environment).\nMessage:\n{}", toNumber, message);
            return;
        }
        try {
            String url = TWILIO_API_BASE + "/Accounts/" + accountSid + "/Messages.json";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set(HttpHeaders.AUTHORIZATION, basicAuth(accountSid, authToken));

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("From", fromNumber);
            body.add("To", "whatsapp:" + toNumber);
            body.add("Body", message);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[WhatsApp] Message sent to {} for order.", toNumber);
            } else {
                log.error("[WhatsApp] Twilio returned {} for number {}", response.getStatusCode(), toNumber);
            }
        } catch (Exception ex) {
            log.error("[WhatsApp] Failed to send message to {}: {}", toNumber, ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String basicAuth(String user, String password) {
        String credentials = user + ":" + password;
        return "Basic " + Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    /** Normalise Indian phone numbers to E.164 format (+91XXXXXXXXXX). */
    private String normalisePhone(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("[^\\d+]", "");
        // Already in international format
        if (digits.startsWith("+")) return digits;
        // Strip leading 0
        if (digits.startsWith("0")) digits = digits.substring(1);
        // Default to India (+91) if 10 digits provided
        if (digits.length() == 10) return "+91" + digits;
        // Prefix + if no country code indicator
        return "+" + digits;
    }

    private String formatPaymentMethod(String method) {
        if (method == null) return "-";
        return switch (method.toUpperCase()) {
            case "COD"      -> "Cash on Delivery 💵";
            case "RAZORPAY" -> "Online Payment (Razorpay) 💳";
            default         -> method;
        };
    }

    private String format(BigDecimal value) {
        if (value == null) return "0.00";
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
