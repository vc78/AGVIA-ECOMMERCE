package com.ems.pragathisweets.service;

import com.ems.pragathisweets.entity.OtpVerification;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.OtpVerificationRepository;
import com.ems.pragathisweets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;

    /**
     * Generates a 6-digit OTP and emails it to the requested new email address.
     */
    @Transactional
    public com.ems.pragathisweets.dto.OtpDispatchResponse sendEmailChangeOtp(Long userId, String newEmail) {
        String cleanEmail = newEmail.trim().toLowerCase();

        // Check if another user already has this email
        if (userRepo.existsByEmail(cleanEmail)) {
            User existing = userRepo.findById(userId).orElse(null);
            if (existing == null || !cleanEmail.equalsIgnoreCase(existing.getEmail())) {
                throw new IllegalArgumentException("This email address is already in use by another account.");
            }
        }

        String code = generateCode();

        OtpVerification otp = OtpVerification.builder()
                .userId(userId)
                .target(cleanEmail)
                .otpType("EMAIL_CHANGE")
                .otpCode(code)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .verified(false)
                .build();
        otpRepo.save(otp);

        String subject = "Email Verification Code: " + code + " — Lokesh Lingam Weaver";
        String htmlBody = buildEmailOtpHtml(code);
        String plainText = "Your Lokesh Lingam Weaver email verification code is: " + code + "\nValid for 10 minutes. Do not share this OTP.";

        boolean liveEmailSent = false;
        try {
            emailService.sendMimeMessage(cleanEmail, subject, htmlBody, plainText);
            liveEmailSent = true;
            log.info("[EMAIL_OTP_DISPATCHED] Successfully sent email OTP to {}", cleanEmail);
        } catch (Exception ex) {
            log.warn("[EMAIL_OTP_FAILED] Live SMTP not sent to {} ({}). OTP code generated safely for client verification.", cleanEmail, ex.getMessage());
        }

        log.info("[OTP_LOG] userId={}, target={}, type=EMAIL_CHANGE, code={}", userId, cleanEmail, code);

        return com.ems.pragathisweets.dto.OtpDispatchResponse.builder()
                .target(cleanEmail)
                .otpType("EMAIL_CHANGE")
                .channel("EMAIL")
                .liveEmailSent(liveEmailSent)
                .expiresInMinutes(10)
                .build();
    }

    /**
     * Verifies the email OTP and updates the user's primary email.
     */
    @Transactional
    public User verifyEmailChangeOtp(Long userId, String newEmail, String otpCode) {
        String cleanEmail = newEmail.trim().toLowerCase();

        OtpVerification otp = otpRepo.findFirstByTargetAndOtpTypeAndVerifiedFalseOrderByCreatedAtDesc(cleanEmail, "EMAIL_CHANGE")
                .orElseThrow(() -> new IllegalArgumentException("No pending verification found for " + cleanEmail));

        if (otp.isExpired()) {
            throw new IllegalArgumentException("The verification code has expired. Please request a new OTP.");
        }

        if (!otp.getOtpCode().equals(otpCode.trim())) {
            throw new IllegalArgumentException("Incorrect verification code. Please check and try again.");
        }

        otp.setVerified(true);
        otpRepo.save(otp);

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setEmail(cleanEmail);
        User saved = userRepo.save(user);

        log.info("[EMAIL_UPDATED] User {} successfully changed email to {}", userId, cleanEmail);
        return saved;
    }

    /**
     * Generates a 6-digit OTP and sends it via WhatsApp / SMS, plus backup email.
     */
    @Transactional
    public com.ems.pragathisweets.dto.OtpDispatchResponse sendPhoneChangeOtp(Long userId, String newPhone) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String cleanDigits = newPhone.replaceAll("[^0-9]", "");
        if (cleanDigits.length() < 10) {
            throw new IllegalArgumentException("Please enter a valid 10-digit Indian mobile number.");
        }

        String formattedPhone = cleanDigits.length() == 10 ? "+91" + cleanDigits : "+" + cleanDigits;
        String code = generateCode();

        OtpVerification otp = OtpVerification.builder()
                .userId(userId)
                .target(formattedPhone)
                .otpType("PHONE_CHANGE")
                .otpCode(code)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .verified(false)
                .build();
        otpRepo.save(otp);

        // 1. WhatsApp / SMS dispatch & Click-to-Chat URL generation
        String whatsAppUrl = whatsAppService.sendOtp(formattedPhone, code);

        // 2. Backup email dispatch to registered user email
        boolean liveEmailSent = false;
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String subject = "Mobile Update Verification Code: " + code + " — Lokesh Lingam Weaver";
            String htmlBody = buildPhoneOtpHtml(user.getFullName(), formattedPhone, code);
            String plainText = "Your mobile update OTP code for " + formattedPhone + " is: " + code + "\nValid for 10 minutes.";
            try {
                emailService.sendMimeMessage(user.getEmail(), subject, htmlBody, plainText);
                liveEmailSent = true;
                log.info("[PHONE_OTP_EMAIL_BACKUP] Sent backup OTP email to {}", user.getEmail());
            } catch (Exception ex) {
                log.warn("[PHONE_OTP_EMAIL_FAILED] Backup email skipped/failed: {}", ex.getMessage());
            }
        }

        log.info("[OTP_LOG] userId={}, target={}, type=PHONE_CHANGE, code={}", userId, formattedPhone, code);

        return com.ems.pragathisweets.dto.OtpDispatchResponse.builder()
                .target(formattedPhone)
                .otpType("PHONE_CHANGE")
                .channel("SMS")
                .otpCode(code)
                .whatsAppUrl(whatsAppUrl)
                .liveEmailSent(liveEmailSent)
                .liveSmsSent(whatsAppService.isConfigured())
                .expiresInMinutes(10)
                .build();
    }

    /**
     * Verifies the phone OTP and updates the user's mobile number.
     */
    @Transactional
    public User verifyPhoneChangeOtp(Long userId, String newPhone, String otpCode) {
        String cleanDigits = newPhone.replaceAll("[^0-9]", "");
        String formattedPhone = cleanDigits.length() == 10 ? "+91" + cleanDigits : "+" + cleanDigits;

        OtpVerification otp = otpRepo.findFirstByTargetAndOtpTypeAndVerifiedFalseOrderByCreatedAtDesc(formattedPhone, "PHONE_CHANGE")
                .orElseThrow(() -> new IllegalArgumentException("No pending verification found for " + formattedPhone));

        if (otp.isExpired()) {
            throw new IllegalArgumentException("The verification code has expired. Please request a new OTP.");
        }

        if (!otp.getOtpCode().equals(otpCode.trim())) {
            throw new IllegalArgumentException("Incorrect verification code. Please check and try again.");
        }

        otp.setVerified(true);
        otpRepo.save(otp);

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPhone(formattedPhone);
        User saved = userRepo.save(user);

        log.info("[PHONE_UPDATED] User {} successfully changed phone to {}", userId, formattedPhone);
        return saved;
    }

    private String generateCode() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 1000000));
    }

    private String buildEmailOtpHtml(String code) {
        return "<!DOCTYPE html><html><body style=\"margin:0;padding:20px;background-color:#FBF5EA;font-family:sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width:500px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E7D4B9;padding:28px;\">" +
                "  <tr><td style=\"text-align:center;padding-bottom:16px;\">" +
                "    <h2 style=\"margin:0;color:#651B2B;font-family:Georgia,serif;\">LOKESH LINGAM WEAVER</h2>" +
                "    <p style=\"margin:4px 0 0;font-size:11px;color:#B58A45;text-transform:uppercase;letter-spacing:1.5px;\">Handloom Sarees &amp; Traditional Weaves</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding:16px 0;text-align:center;\">" +
                "    <h3 style=\"margin:0 0 12px;color:#38271F;\">Email Verification Code</h3>" +
                "    <p style=\"margin:0 0 20px;font-size:14px;color:#5A4438;\">Use the one-time verification code below to confirm your email address:</p>" +
                "    <div style=\"display:inline-block;padding:14px 28px;background-color:#FBF5EA;border:2px dashed #651B2B;border-radius:12px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#651B2B;font-family:monospace;\">" +
                code +
                "    </div>" +
                "    <p style=\"margin:20px 0 0;font-size:12px;color:#7A6254;\">This code is valid for <strong>10 minutes</strong>. If you did not request this change, please ignore this email.</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding-top:20px;border-top:1px solid #E7D4B9;text-align:center;font-size:11px;color:#7A6254;\">" +
                "    © Lokesh Lingam Weaver • Dharmavaram, Andhra Pradesh, India – 515671" +
                "  </td></tr>" +
                "</table></body></html>";
    }

    private String buildPhoneOtpHtml(String customerName, String targetPhone, String code) {
        return "<!DOCTYPE html><html><body style=\"margin:0;padding:20px;background-color:#FBF5EA;font-family:sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width:500px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E7D4B9;padding:28px;\">" +
                "  <tr><td style=\"text-align:center;padding-bottom:16px;\">" +
                "    <h2 style=\"margin:0;color:#651B2B;font-family:Georgia,serif;\">LOKESH LINGAM WEAVER</h2>" +
                "    <p style=\"margin:4px 0 0;font-size:11px;color:#B58A45;text-transform:uppercase;letter-spacing:1.5px;\">Handloom Sarees &amp; Traditional Weaves</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding:16px 0;text-align:center;\">" +
                "    <h3 style=\"margin:0 0 12px;color:#38271F;\">Mobile Number Update OTP</h3>" +
                "    <p style=\"margin:0 0 20px;font-size:14px;color:#5A4438;\">Namaste " + customerName + ", here is your verification code to update your mobile number to <strong>" + targetPhone + "</strong>:</p>" +
                "    <div style=\"display:inline-block;padding:14px 28px;background-color:#FBF5EA;border:2px dashed #651B2B;border-radius:12px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#651B2B;font-family:monospace;\">" +
                code +
                "    </div>" +
                "    <p style=\"margin:20px 0 0;font-size:12px;color:#7A6254;\">This code is valid for <strong>10 minutes</strong>. Never share your OTP with anyone.</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding-top:20px;border-top:1px solid #E7D4B9;text-align:center;font-size:11px;color:#7A6254;\">" +
                "    © Lokesh Lingam Weaver • Dharmavaram, Andhra Pradesh, India – 515671" +
                "  </td></tr>" +
                "</table></body></html>";
    }
}
