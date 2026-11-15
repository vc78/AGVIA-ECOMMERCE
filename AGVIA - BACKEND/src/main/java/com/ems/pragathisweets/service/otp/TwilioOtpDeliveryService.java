package com.ems.pragathisweets.service.otp;

import com.ems.pragathisweets.util.PhoneUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service("twilioOtpDeliveryService")
@Slf4j
public class TwilioOtpDeliveryService implements OtpDeliveryService {

    private static final String TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

    @Value("${twilio.account-sid:${app.whatsapp.twilio.account-sid:}}")
    private String accountSid;

    @Value("${twilio.auth-token:${app.whatsapp.twilio.auth-token:}}")
    private String authToken;

    @Value("${twilio.api-key:${TWILIO_API_KEY:}}")
    private String apiKey;

    @Value("${twilio.api-secret:${TWILIO_API_SECRET:}}")
    private String apiSecret;

    @Value("${twilio.from-number:${TWILIO_FROM_NUMBER:+919032306961}}")
    private String fromNumber;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void sendOtp(String phoneNumber, String otp, String purpose) {
        String masked = PhoneUtils.mask(phoneNumber);

        String sid = (accountSid != null && !accountSid.isBlank()) ? accountSid : apiKey;
        String token = (authToken != null && !authToken.isBlank()) ? authToken : apiSecret;

        if (sid == null || sid.isBlank() || token == null || token.isBlank()) {
            log.info("[Twilio SMS] Twilio credentials not configured; skipping direct SMS gateway for {}. Purpose: {}", masked, purpose);
            return;
        }

        try {
            String url = TWILIO_API_BASE + "/Accounts/" + sid + "/Messages.json";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set(HttpHeaders.AUTHORIZATION, "Basic " + Base64.getEncoder()
                    .encodeToString((sid + ":" + token).getBytes(StandardCharsets.UTF_8)));

            String messageText = "AGVIA Boutique Verification Code: " + otp + ". Valid for 5 minutes. Do not share this OTP.";

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("From", fromNumber);
            body.add("To", phoneNumber);
            body.add("Body", messageText);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[Twilio SMS] OTP successfully sent to {} for purpose {}", masked, purpose);
            } else {
                log.warn("[Twilio SMS] Twilio returned status {} for {}", response.getStatusCode(), masked);
            }
        } catch (org.springframework.web.client.HttpStatusCodeException httpEx) {
            log.error("[Twilio SMS] Failed to send SMS to {}. HTTP {}: {}", masked, httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("[Twilio SMS] Failed to send SMS to {}: {}", masked, ex.getMessage());
        }
    }
}
