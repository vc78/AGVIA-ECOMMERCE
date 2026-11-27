package com.ems.pragathisweets.service.otp;

import com.ems.pragathisweets.util.PhoneUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service("mockOtpDeliveryService")
@Slf4j
public class MockOtpDeliveryService implements OtpDeliveryService {

    @Override
    public void sendOtp(String phoneNumber, String otp, String purpose) {
        String masked = PhoneUtils.mask(phoneNumber);
        log.info("[MOCK SMS] OTP dispatched for purpose {} to {}", purpose, masked);
        // Safe console output for local development / testing without sending real paid SMS
        System.out.println("===========================================================");
        System.out.println("🔑 [AGVIA MOCK OTP DELIVERY]");
        System.out.println("📱 Recipient (Masked): " + masked);
        System.out.println("🎯 Purpose:            " + purpose);
        System.out.println("🔢 6-Digit OTP:        " + otp);
        System.out.println("⏳ Valid for:          5 minutes");
        System.out.println("===========================================================");
    }
}
