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

    @Value("${app.frontend.url:https://agvia-ecommerce.vercel.app}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a");

    @Async
    public void sendWelcomeEmail(String to, String fullName) {
        String subject = "Welcome to Lokesh Lingam Weaver";
        String body = "Hi " + fullName + ",\n\n" +
                "Thank you for registering with Lokesh Lingam Weaver (Dharmavaram, Andhra Pradesh).\n" +
                "Explore Dharmavaram silk sarees, Kanchi-style silk sarees, and traditional handloom weaves.\n" +
                "For any assistance, contact us on Phone / WhatsApp: +91 7799349294\n\n" +
                "Warm regards,\nLokesh Lingam Weaver";
        send(to, subject, body);
    }

    /**
     * Sends a single-use password reset email containing a cryptographically random link.
     * Raw tokens and reset URLs are never written to application logs.
     */
    @Async
    public void sendPasswordResetEmail(String to, String recipientName, String resetLink) {
        String safeName = (recipientName != null && !recipientName.isBlank())
                ? recipientName.replace("<", "").replace(">", "")
                : "Customer";
        String subject = "Password Reset Request — Lokesh Lingam Weaver";
        String htmlBody = "<!DOCTYPE html><html><body style=\"margin:0;padding:24px;background-color:#FBF5EA;font-family:sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E7D4B9;padding:32px;\">" +
                "  <tr><td style=\"text-align:center;padding-bottom:16px;border-bottom:1px solid #E7D4B9;\">" +
                "    <h2 style=\"margin:0;color:#651B2B;font-family:Georgia,serif;\">LOKESH LINGAM WEAVER</h2>" +
                "    <p style=\"margin:4px 0 0;font-size:11px;color:#B58A45;text-transform:uppercase;letter-spacing:2px;\">Handloom Sarees &amp; Traditional Weaves</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding:24px 0;\">" +
                "    <h3 style=\"margin:0 0 12px;color:#38271F;font-size:18px;\">Reset Your Password</h3>" +
                "    <p style=\"margin:0 0 16px;font-size:14px;color:#38271F;line-height:1.6;\">Namaste " + safeName + ", we received a request to reset your account password.</p>" +
                "    <p style=\"margin:0 0 24px;text-align:center;\">" +
                "      <a href=\"" + resetLink + "\" style=\"display:inline-block;padding:13px 28px;background-color:#651B2B;color:#FBF5EA;text-decoration:none;font-weight:bold;border-radius:10px;font-size:13px;letter-spacing:0.5px;\">Reset Password</a>" +
                "    </p>" +
                "    <p style=\"margin:0 0 12px;font-size:12px;color:#5A4438;line-height:1.5;\">This link expires in <strong>15 minutes</strong> and can only be used once. If you did not request a password reset, you may safely ignore this email.</p>" +
                "  </td></tr>" +
                "  <tr><td style=\"padding-top:16px;border-top:1px solid #E7D4B9;text-align:center;font-size:11px;color:#7A6254;\">" +
                "    Lokesh Lingam Weaver • Dharmavaram, Andhra Pradesh, India – 515671 • +91 7799349294" +
                "  </td></tr>" +
                "</table></body></html>";
        String plainText = "Namaste " + safeName + ",\n\n" +
                "We received a request to reset your Lokesh Lingam Weaver password.\n" +
                "Use this single-use link within 15 minutes:\n" + resetLink + "\n\n" +
                "If you did not request this change, please ignore this message.";
        sendHtml(to, subject, htmlBody, plainText);
    }

    /**
     * Rich HTML order confirmation email sent upon order confirmation.
     */
    @Async
    public void sendOrderConfirmationEmail(OrderResponse order, String customerEmail, String customerName) {
        if (order == null || customerEmail == null || customerEmail.isBlank()) {
            log.warn("[Email] No customer email found for order {} – skipping confirmation email", order != null ? order.getOrderNumber() : "null");
            return;
        }

        String to = customerEmail;
        String name = customerName != null && !customerName.isBlank() ? customerName : (order.getUserName() != null ? order.getUserName() : "Valued Customer");
        String subject = "Order Confirmed #" + order.getOrderNumber() + " — Lokesh Lingam Weaver";
        String htmlBody = buildOrderConfirmationHtml(order, name);
        String plainText = buildOrderConfirmationText(order, name);

        sendHtml(to, subject, htmlBody, plainText);

        // Notify store owner email if configured
        if (storeNotificationEmail != null && !storeNotificationEmail.isBlank() && !storeNotificationEmail.equalsIgnoreCase(to)) {
            String storeSubject = "[New Order Alert] #" + order.getOrderNumber() + " received — ₹" + formatMoney(order.getFinalAmount());
            sendHtml(storeNotificationEmail, storeSubject, htmlBody, plainText);
        }
    }

    /**
     * Backward-compatible simple order confirmation.
     */
    @Async
    public void sendOrderConfirmationEmail(String to, String orderNumber, String amount) {
        String subject = "Order Confirmation - " + orderNumber + " — Lokesh Lingam Weaver";
        String body = "Your order " + orderNumber + " for Rs. " + amount + " has been placed successfully with Lokesh Lingam Weaver.\n\n" +
                "We will share dispatch updates once your order ships.\n" +
                "For assistance, contact Phone / WhatsApp: +91 7799349294";
        send(to, subject, body);
    }

    @Async
    public void sendOrderStatusUpdateEmail(String to, String orderNumber, String status) {
        String subject = "Order Update - " + orderNumber + " — Lokesh Lingam Weaver";
        String body = "Your order " + orderNumber + " status has been updated to: " + status + ".\n\n" +
                "Thank you for choosing Lokesh Lingam Weaver (Dharmavaram).\nPhone / WhatsApp: +91 7799349294";
        send(to, subject, body);
    }

    /**
     * Sent when a COD order is delivered and cash payment is confirmed collected.
     */
    @Async
    public void sendCodPaymentCollectedEmail(String to, String orderNumber, String amount) {
        String subject = "Payment Received — Order " + orderNumber + " — Lokesh Lingam Weaver";
        String body = "Namaste,\n\n" +
                "Your Cash on Delivery payment of ₹" + amount + " for order " + orderNumber +
                " has been recorded as collected upon delivery.\n\n" +
                "Thank you for choosing Lokesh Lingam Weaver!\nPhone / WhatsApp: +91 7799349294";
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
        helper.setFrom(fromAddress, "Lokesh Lingam Weaver");
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

        String logoUrl = frontendUrl.replaceAll("/+$", "") + "/images/lokesh-lingam-logo.png";
        return "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
                "<body style=\"margin: 0; padding: 20px; background-color: #FBF5EA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E7D4B9; box-shadow: 0 4px 15px rgba(101,27,43,0.06); overflow: hidden;\">" +
                "  <tr>" +
                "    <td style=\"background: linear-gradient(135deg, #651B2B 0%, #38271F 100%); padding: 28px 24px; text-align: center; color: #FFFFFF;\">" +
                "      <div style=\"display:inline-block;background:#FBF5EA;padding:8px 14px;border-radius:10px;margin-bottom:10px;\">" +
                "        <img src=\"" + logoUrl + "\" alt=\"Lokesh Lingam Weaver\" style=\"max-height:60px;width:auto;display:block;\" />" +
                "      </div>" +
                "      <p style=\"margin: 4px 0 0 0; font-size: 12px; color: #E7D4B9; letter-spacing: 2px; text-transform: uppercase;\">Handloom Sarees &amp; Traditional Weaves</p>" +
                "      <div style=\"display: inline-block; margin-top: 12px; background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold;\">" +
                "        Order Confirmed" +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"padding: 24px 28px;\">" +
                "      <h2 style=\"margin: 0 0 10px 0; color: #651B2B; font-size: 18px;\">Namaste, " + customerName + "!</h2>" +
                "      <p style=\"margin: 0 0 20px 0; color: #38271F; font-size: 14px; line-height: 1.5;\">" +
                "        Thank you for ordering from Lokesh Lingam Weaver (Dharmavaram, Andhra Pradesh). Your order has been confirmed." +
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
                "        <p style=\"margin: 0 0 8px 0; font-size: 13px; color: #666;\">Dispatch updates will be shared via WhatsApp and your Track Order page.</p>" +
                "        <p style=\"margin: 0; font-size: 12px; color: #777;\">Need assistance? Phone or WhatsApp: <strong style=\"color: #651B2B;\">+91 7799349294</strong></p>" +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"background-color: #E7D4B9; padding: 16px; text-align: center; font-size: 12px; color: #38271F;\">" +
                "      © Lokesh Lingam Weaver • Dharmavaram, Andhra Pradesh, India – 515671" +
                "    </td>" +
                "  </tr>" +
                "</table></body></html>";
    }

    private String buildOrderConfirmationText(OrderResponse order, String customerName) {
        StringBuilder sb = new StringBuilder();
        sb.append("LOKESH LINGAM WEAVER - ORDER CONFIRMED\n");
        sb.append("=====================================\n\n");
        sb.append("Namaste ").append(customerName).append(",\n\n");
        sb.append("Thank you for ordering from Lokesh Lingam Weaver! Your order has been confirmed.\n\n");
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
        sb.append("\nFor order or dispatch queries, reach us on Phone / WhatsApp: +91 7799349294\n\n");
        sb.append("Warm regards,\nLokesh Lingam Weaver\nDharmavaram, Andhra Pradesh - 515671");
        return sb.toString();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
