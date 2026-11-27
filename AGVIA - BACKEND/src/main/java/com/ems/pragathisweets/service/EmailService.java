package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderItemResponse;
import com.ems.pragathisweets.dto.OrderResponse;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

/**
 * Sends transactional emails via SMTP (e.g. Gmail).
 * Email dispatch is guarded by app.mail.enabled and runs asynchronously.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.store-notification-email:}")
    private String storeNotificationEmail;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a");

    @Async
    public void sendWelcomeEmail(String to, String fullName) {
        String subject = "Welcome to Pragathi Sweets!";
        String body = "Hi " + fullName + ",\n\n" +
                "Thank you for registering with Pragathi Sweets. Explore our range of authentic sweets and snacks!\n\n" +
                "Warm regards,\nPragathi Sweets Team";
        send(to, subject, body);
    }

    /**
     * Sends rich HTML verification code directly to customer's email.
     */
    @Async
    public void sendOtpEmail(String to, String recipientName, String code, String purpose) {
        String subject = "🔐 " + code + " is your AGVIA verification code";
        String htmlBody = "<!DOCTYPE html><html><body style=\"margin:0;padding:24px;background-color:#FFFDF8;font-family:sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width:480px;background-color:#FFFFFF;border-radius:20px;border:1px solid #EADDC9;padding:32px;box-shadow:0 4px 16px rgba(139,0,0,0.06);\">" +
                "  <tr><td style=\"text-align:center;padding-bottom:16px;\">" +
                "    <h2 style=\"margin:0;color:#8B0000;letter-spacing:3px;font-size:24px;\">AGVIA</h2>" +
                "    <p style=\"margin:4px 0 0;font-size:11px;color:#B8860B;text-transform:uppercase;letter-spacing:2px;font-weight:600;\">Haute Couture Boutique</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding:16px 0;text-align:center;\">" +
                "    <h3 style=\"margin:0 0 10px;color:#3A2D23;font-size:18px;\">Verification Code</h3>" +
                "    <p style=\"margin:0 0 20px;font-size:13px;color:#666;line-height:1.5;\">Hello " + (recipientName != null && !recipientName.isBlank() ? recipientName : "Client") + ", use the code below to complete your " + (purpose != null ? purpose.toLowerCase() : "verification") + ":</p>" +
                "    <div style=\"display:inline-block;padding:16px 32px;background-color:#FFFDF8;border:2px dashed #8B0000;border-radius:14px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#8B0000;font-family:monospace;\">" +
                code +
                "    </div>" +
                "    <p style=\"margin:20px 0 0;font-size:12px;color:#888;\">This code is valid for <strong>5 minutes</strong>. Do not share this OTP with anyone.</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding-top:20px;border-top:1px solid #EEE;text-align:center;font-size:11px;color:#AAA;\">" +
                "    © AGVIA • Luxury Women's Wear Boutique • All rights reserved." +
                "  </td></tr>" +
                "</table></body></html>";
        String plainText = "AGVIA Boutique Verification Code: " + code + "\nValid for 5 minutes. Never share this code.";
        sendHtml(to, subject, htmlBody, plainText);
    }

    /**
     * Rich HTML order confirmation email sent to customer's Gmail upon order confirmation.
     * Uses detached thread-safe OrderResponse DTO to avoid cross-thread Hibernate Session concurrency issues.
     */
    @Async
    public void sendOrderConfirmationEmail(OrderResponse order, String customerEmail, String customerName) {
        if (order == null || customerEmail == null || customerEmail.isBlank()) {
            log.warn("[Email] No customer email found for order {} – skipping confirmation email", order != null ? order.getOrderNumber() : "null");
            return;
        }

        String to = customerEmail;
        String name = customerName != null && !customerName.isBlank() ? customerName : (order.getUserName() != null ? order.getUserName() : "Valued Customer");
        String subject = "✅ Order Confirmed #" + order.getOrderNumber() + " — Pragathi Sweets";
        String htmlBody = buildOrderConfirmationHtml(order, name);
        String plainText = buildOrderConfirmationText(order, name);

        sendHtml(to, subject, htmlBody, plainText);

        // Notify store manager / kitchen dispatch email if configured
        if (storeNotificationEmail != null && !storeNotificationEmail.isBlank() && !storeNotificationEmail.equalsIgnoreCase(to)) {
            String storeSubject = "🔔 [New Order Alert] #" + order.getOrderNumber() + " received — ₹" + formatMoney(order.getFinalAmount());
            sendHtml(storeNotificationEmail, storeSubject, htmlBody, plainText);
        }
    }

    /**
     * Backward-compatible simple order confirmation.
     */
    @Async
    public void sendOrderConfirmationEmail(String to, String orderNumber, String amount) {
        String subject = "Order Confirmation - " + orderNumber;
        String body = "Your order " + orderNumber + " for Rs. " + amount + " has been placed successfully.\n\n" +
                "We will notify you once it is shipped.\n\nThank you for shopping with Pragathi Sweets!";
        send(to, subject, body);
    }

    @Async
    public void sendOrderStatusUpdateEmail(String to, String orderNumber, String status) {
        String subject = "Order Update - " + orderNumber;
        String body = "Your order " + orderNumber + " status has been updated to: " + status + ".\n\n" +
                "Thank you for shopping with Pragathi Sweets!";
        send(to, subject, body);
    }

    /**
     * Sent when a COD order is delivered and cash payment is confirmed collected
     * by the delivery agent. Serves as the customer's payment receipt for COD.
     */
    @Async
    public void sendCodPaymentCollectedEmail(String to, String orderNumber, String amount) {
        String subject = "Payment Received — Order " + orderNumber;
        String body = "Hi,\n\n" +
                "Your Cash on Delivery payment of ₹" + amount + " for order " + orderNumber +
                " has been successfully collected by our delivery partner.\n\n" +
                "Your order is now complete. Thank you for choosing Pragathi Sweets!\n\n" +
                "Warm regards,\nPragathi Sweets Team";
        send(to, subject, body);
    }

    public boolean isMailConfigured() {
        return mailEnabled && mailPassword != null && !mailPassword.isBlank();
    }

    public void sendMimeMessage(String to, String subject, String htmlBody, String plainText) throws Exception {
        if (!mailEnabled) {
            log.info("[Email] Mail disabled (app.mail.enabled=false). Skipping email to {} - subject: {}", to, subject);
            return;
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            String err = "[Email] Gmail App Password not set (MAIL_PASSWORD). To enable emails: go to myaccount.google.com/apppasswords, generate an App Password, and set spring.mail.password in application.properties.";
            log.warn(err);
            throw new IllegalStateException(err);
        }

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(fromAddress, "Pragathi Sweets");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(plainText, htmlBody);
        mailSender.send(mimeMessage);
        log.info("[Email] Successfully sent HTML email to {}", to);
    }

    public void sendHtml(String to, String subject, String htmlBody, String plainText) {
        try {
            sendMimeMessage(to, subject, htmlBody, plainText);
        } catch (Exception ex) {
            log.error("[Email] Failed to send HTML email to {}: {}. Attempting fallback plain-text email.", to, ex.getMessage());
            send(to, subject, plainText);
        }
    }

    private void send(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("[Email] Mail disabled (app.mail.enabled=false). Skipping email to {} - subject: {}", to, subject);
            return;
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            log.warn("[Email] Gmail App Password not set (MAIL_PASSWORD). Skipping email to {}", to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[Email] Successfully sent plain-text email to {}", to);
        } catch (Exception ex) {
            log.error("[Email] Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Email Template Builders
    // ─────────────────────────────────────────────────────────────────────────

    private String buildOrderConfirmationHtml(OrderResponse order, String customerName) {
        StringBuilder itemsHtml = new StringBuilder();
        if (order.getItems() != null) {
            for (OrderItemResponse item : order.getItems()) {
                itemsHtml.append("<tr>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #3A2D23; font-size: 14px;\">")
                        .append("<strong>").append(item.getProductName()).append("</strong>")
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #3A2D23; font-size: 14px; text-align: center;\">")
                        .append(item.getQuantity())
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #3A2D23; font-size: 14px; text-align: right;\">")
                        .append("₹").append(formatMoney(item.getPrice()))
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #8B0000; font-size: 14px; font-weight: bold; text-align: right;\">")
                        .append("₹").append(formatMoney(item.getSubtotal()))
                        .append("</td>")
                        .append("</tr>");
            }
        }

        String orderDate = order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FMT) : "Today";
        String paymentMethodStr = order.getPaymentMethod() != null ? order.getPaymentMethod() : "ONLINE";
        String paymentDisplay = paymentMethodStr.equalsIgnoreCase("COD") ? "Cash on Delivery 💵" : "Online Payment (Razorpay) 💳";
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        String discountRow = "";
        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            discountRow = "<tr><td style=\"padding: 6px 0; color: #2E7D32;\">🏷️ Discount Applied:</td><td style=\"padding: 6px 0; text-align: right; color: #2E7D32; font-weight: bold;\">-₹" + formatMoney(discount) + "</td></tr>";
        }

        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (order.getFinalAmount() != null && order.getTotalAmount() != null) {
            deliveryFee = order.getFinalAmount().subtract(order.getTotalAmount()).add(discount);
        }
        String deliveryDisplay = deliveryFee.compareTo(BigDecimal.ZERO) > 0 ? "₹" + formatMoney(deliveryFee) : "<span style=\"color: #2E7D32; font-weight: bold;\">FREE 🎁</span>";

        String address = order.getShippingAddress() != null ? order.getShippingAddress() : "Address provided during checkout";
        String phone = order.getContactPhone() != null ? order.getContactPhone() : "-";

        return "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
                "<body style=\"margin: 0; padding: 20px; background-color: #FFFDF8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EADDC9; box-shadow: 0 4px 15px rgba(139,0,0,0.05); overflow: hidden;\">" +
                "  <tr>" +
                "    <td style=\"background: linear-gradient(135deg, #8B0000 0%, #5B0000 100%); padding: 30px 24px; text-align: center; color: #FFFFFF;\">" +
                "      <h1 style=\"margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px; color: #FFFDF8;\">PRAGATHI SWEETS</h1>" +
                "      <p style=\"margin: 4px 0 0 0; font-size: 13px; color: #EADDC9; letter-spacing: 2px; text-transform: uppercase;\">Taste The Tradition</p>" +
                "      <div style=\"display: inline-block; margin-top: 15px; background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold;\">" +
                "        ✅ Order Confirmed" +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"padding: 24px 28px;\">" +
                "      <h2 style=\"margin: 0 0 10px 0; color: #8B0000; font-size: 18px;\">Namaste, " + customerName + "!</h2>" +
                "      <p style=\"margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.5;\">" +
                "        Thank you for choosing Pragathi Sweets. Your authentic traditional sweets order has been confirmed and is being prepared with pure ghee and the finest ingredients." +
                "      </p>" +
                "      <table width=\"100%\" style=\"background-color: #FAF6EE; border-radius: 12px; padding: 16px; margin-bottom: 24px;\">" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Order Number:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 14px; color: #8B0000; font-weight: bold;\">#" + order.getOrderNumber() + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Order Date:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #333;\">" + orderDate + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Payment Mode:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #333;\">" + paymentDisplay + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Contact Phone:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #333;\">" + phone + "</td>" +
                "        </tr>" +
                "      </table>" +
                "      <h3 style=\"margin: 0 0 12px 0; font-size: 15px; color: #3A2D23; border-bottom: 2px solid #8B0000; padding-bottom: 6px;\">Items Ordered</h3>" +
                "      <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse: collapse; margin-bottom: 20px;\">" +
                "        <thead>" +
                "          <tr style=\"background-color: #F8F3EA;\">" +
                "            <th style=\"padding: 8px 12px; text-align: left; font-size: 12px; color: #8B0000; text-transform: uppercase;\">Item</th>" +
                "            <th style=\"padding: 8px 12px; text-align: center; font-size: 12px; color: #8B0000; text-transform: uppercase;\">Qty</th>" +
                "            <th style=\"padding: 8px 12px; text-align: right; font-size: 12px; color: #8B0000; text-transform: uppercase;\">Price</th>" +
                "            <th style=\"padding: 8px 12px; text-align: right; font-size: 12px; color: #8B0000; text-transform: uppercase;\">Total</th>" +
                "          </tr>" +
                "        </thead>" +
                "        <tbody>" + itemsHtml + "</tbody>" +
                "      </table>" +
                "      <table align=\"right\" style=\"width: 260px; margin-bottom: 24px; font-size: 13px;\">" +
                "        <tr><td style=\"padding: 4px 0; color: #666;\">Subtotal:</td><td style=\"padding: 4px 0; text-align: right; color: #333;\">₹" + formatMoney(order.getTotalAmount()) + "</td></tr>" +
                discountRow +
                "        <tr><td style=\"padding: 4px 0; color: #666;\">Delivery:</td><td style=\"padding: 4px 0; text-align: right;\">" + deliveryDisplay + "</td></tr>" +
                "        <tr style=\"border-top: 1px solid #DDD;\"><td style=\"padding: 8px 0; font-size: 16px; font-weight: bold; color: #8B0000;\">Total Payable:</td><td style=\"padding: 8px 0; text-align: right; font-size: 16px; font-weight: bold; color: #8B0000;\">₹" + formatMoney(order.getFinalAmount()) + "</td></tr>" +
                "      </table>" +
                "      <div style=\"clear: both;\"></div>" +
                "      <div style=\"background-color: #FAF6EE; border-left: 4px solid #B8860B; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;\">" +
                "        <strong style=\"color: #8B0000; font-size: 13px;\">📍 Delivery Address:</strong>" +
                "        <p style=\"margin: 4px 0 0 0; font-size: 13px; color: #444;\">" + address + "</p>" +
                "      </div>" +
                "      <div style=\"text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #EEE;\">" +
                "        <p style=\"margin: 0 0 8px 0; font-size: 13px; color: #777;\">Estimated Delivery: 2–4 Business Days</p>" +
                "        <p style=\"margin: 0; font-size: 12px; color: #888;\">Need assistance? WhatsApp or call us anytime at <strong style=\"color: #075E54;\">+91 90323 06961</strong></p>" +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"background-color: #F8F3EA; padding: 16px; text-align: center; font-size: 12px; color: #8A7A6D;\">" +
                "      © AGVIA Women's Wear Boutique • Heritage & Couture • All rights reserved." +
                "    </td>" +
                "  </tr>" +
                "</table></body></html>";
    }

    private String buildOrderConfirmationText(OrderResponse order, String customerName) {
        StringBuilder sb = new StringBuilder();
        sb.append("AGVIA WOMEN'S WEAR BOUTIQUE - ORDER CONFIRMED\n");
        sb.append("=====================================\n\n");
        sb.append("Dear ").append(customerName).append(",\n\n");
        sb.append("Thank you for choosing AGVIA! Your order has been placed and confirmed.\n\n");
        sb.append("Order Number: #").append(order.getOrderNumber()).append("\n");
        sb.append("Total Amount: Rs. ").append(formatMoney(order.getFinalAmount())).append("\n");
        sb.append("Payment Mode: ").append(order.getPaymentMethod()).append("\n");
        sb.append("Delivery Address: ").append(order.getShippingAddress()).append("\n\n");
        sb.append("Items Ordered:\n");
        if (order.getItems() != null) {
            for (OrderItemResponse item : order.getItems()) {
                sb.append("- ").append(item.getProductName())
                        .append(" x ").append(item.getQuantity())
                        .append(" (Rs. ").append(formatMoney(item.getSubtotal())).append(")\n");
            }
        }
        sb.append("\nEstimated Delivery: 2-4 business days.\n");
        sb.append("For queries or quick dispatch status, reach us on WhatsApp: +91 90323 06961\n\n");
        sb.append("Warm regards,\nAGVIA Boutique Team");
        return sb.toString();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
