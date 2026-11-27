package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderEmailData;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class EmailTemplateService {

    public record EmailContent(String subject, String htmlBody, String plainText) {}

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Customer Order Confirmation
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildCustomerOrderConfirmation(OrderEmailData data) {
        String subject = "✅ Order Confirmed #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Order Confirmed";
        String statusMessage = "Namaste " + escapeHtml(data.getCustomerName()) + "! Thank you for choosing Pragathi Sweets. Your authentic traditional sweets order has been confirmed and is being prepared with pure ghee and the finest ingredients.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "✅ Confirmed", "#2E7D32", true);
        String text = renderOrderPlainText(data, "ORDER CONFIRMED", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Admin New Order Alert
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildAdminNewOrderNotification(OrderEmailData data) {
        String subject = "🔔 [Admin Alert] New Order #" + data.getOrderNumber() + " — ₹" + formatMoney(data.getGrandTotal());
        String statusTitle = "New Customer Order Received";
        String statusMessage = "A new order has been placed on the storefront and requires kitchen dispatch processing.";

        String html = renderAdminOrderEmail(data, statusTitle, statusMessage);
        String text = renderAdminOrderPlainText(data);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Payment Confirmation (Standalone)
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildPaymentConfirmation(OrderEmailData data) {
        String subject = "💳 Payment Received — Order #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Payment Successfully Verified";
        String statusMessage = "We have received your payment of ₹" + formatMoney(data.getGrandTotal()) + " for order #" + data.getOrderNumber() + ". Your order is now confirmed for preparation.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "💳 Payment Received", "#1565C0", true);
        String text = renderOrderPlainText(data, "PAYMENT RECEIVED", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Order Preparing
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildOrderPreparingNotification(OrderEmailData data) {
        String subject = "👨‍🍳 Your Order is Being Prepared — #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Preparing With Care";
        String statusMessage = "Your order is now being prepared in our kitchen with pure ghee, fresh ingredients, and time-honored artisanal recipes.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "👨‍🍳 Preparing", "#B8860B", false);
        String text = renderOrderPlainText(data, "ORDER PREPARING", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Order Ready
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildOrderReadyNotification(OrderEmailData data) {
        String subject = "📦 Order Packed & Ready — #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Ready for Dispatch";
        String statusMessage = "Your sweets have been packed in our signature gift boxes and are ready for handover to our delivery partner.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "📦 Packed & Ready", "#B8860B", false);
        String text = renderOrderPlainText(data, "ORDER READY", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Out For Delivery
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildOutForDeliveryNotification(OrderEmailData data) {
        String subject = "🚚 Out For Delivery — #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "On the Way to Your Doorstep";
        String statusMessage = "Good news! Your order #" + data.getOrderNumber() + " is out for delivery. Our delivery partner will reach your address shortly.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "🚚 Out For Delivery", "#0288D1", false);
        String text = renderOrderPlainText(data, "OUT FOR DELIVERY", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Order Delivered
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildOrderDeliveredNotification(OrderEmailData data) {
        String subject = "🎉 Delivered — Order #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Order Delivered Successfully";
        String statusMessage = "Your order has been safely delivered. We hope you enjoy the authentic taste of tradition! Thank you for choosing Pragathi Sweets.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "🎉 Delivered", "#2E7D32", false);
        String text = renderOrderPlainText(data, "ORDER DELIVERED", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Order Cancelled
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildOrderCancelledNotification(OrderEmailData data, String reason) {
        String subject = "❌ Order Cancelled — #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Order Cancelled";
        String reasonStr = (reason != null && !reason.isBlank()) ? "Reason: " + escapeHtml(reason) : "Your order has been cancelled upon request.";
        String refundNote = "ONLINE".equalsIgnoreCase(data.getPaymentMethod()) || "RAZORPAY".equalsIgnoreCase(data.getPaymentMethod())
                ? " If your payment was deducted, the refund will be initiated to your original payment method within 5–7 business days."
                : "";
        String statusMessage = reasonStr + refundNote;

        String html = renderOrderEmail(data, statusTitle, statusMessage, "❌ Cancelled", "#C62828", false);
        String text = renderOrderPlainText(data, "ORDER CANCELLED", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Refund Processed
    // ─────────────────────────────────────────────────────────────────────────
    public EmailContent buildRefundProcessedNotification(OrderEmailData data) {
        String subject = "💰 Refund Processed — Order #" + data.getOrderNumber() + " — Pragathi Sweets";
        String statusTitle = "Refund Completed";
        String statusMessage = "A refund of ₹" + formatMoney(data.getGrandTotal()) + " for order #" + data.getOrderNumber() + " has been processed to your original payment source. It should reflect in your account within 5–7 banking days.";

        String html = renderOrderEmail(data, statusTitle, statusMessage, "💰 Refunded", "#6A1B9A", false);
        String text = renderOrderPlainText(data, "REFUND PROCESSED", statusMessage);
        return new EmailContent(subject, html, text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTML Builder
    // ─────────────────────────────────────────────────────────────────────────
    private String renderOrderEmail(OrderEmailData data, String title, String introMessage, String statusBadge, String badgeColor, boolean isConfirmation) {
        StringBuilder itemsHtml = new StringBuilder();
        if (data.getItems() != null) {
            for (OrderEmailData.ItemData item : data.getItems()) {
                itemsHtml.append("<tr>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #3A2D23; font-size: 14px;\">")
                        .append("<strong>").append(escapeHtml(item.getProductName())).append("</strong>")
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #3A2D23; font-size: 14px; text-align: center;\">")
                        .append(item.getQuantity())
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #3A2D23; font-size: 14px; text-align: right;\">")
                        .append("₹").append(formatMoney(item.getUnitPrice()))
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #F3EDE2; color: #8B0000; font-size: 14px; font-weight: bold; text-align: right;\">")
                        .append("₹").append(formatMoney(item.getTotal()))
                        .append("</td>")
                        .append("</tr>");
            }
        }

        String discountRow = "";
        if (data.getDiscount() != null && data.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            discountRow = "<tr><td style=\"padding: 6px 0; color: #2E7D32;\">🏷️ Discount Applied:</td><td style=\"padding: 6px 0; text-align: right; color: #2E7D32; font-weight: bold;\">-₹" + formatMoney(data.getDiscount()) + "</td></tr>";
        }

        String deliveryDisplay = (data.getDeliveryCharge() != null && data.getDeliveryCharge().compareTo(BigDecimal.ZERO) > 0)
                ? "₹" + formatMoney(data.getDeliveryCharge())
                : "<span style=\"color: #2E7D32; font-weight: bold;\">FREE 🎁</span>";

        String paymentMethodStr = data.getPaymentMethod() != null ? data.getPaymentMethod() : "ONLINE";
        String paymentDisplay = paymentMethodStr.equalsIgnoreCase("COD") ? "Cash on Delivery 💵" : "Online Payment (Razorpay) 💳";
        String paymentStatusStr = data.getPaymentStatus() != null ? data.getPaymentStatus() : "PENDING";

        String trackingBtn = "";
        if (data.getTrackingUrl() != null && !data.getTrackingUrl().isBlank()) {
            trackingBtn = "<div style=\"text-align: center; margin: 25px 0;\">" +
                    "<a href=\"" + escapeHtml(data.getTrackingUrl()) + "\" style=\"display: inline-block; background-color: #8B0000; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;\">Track Order Online →</a>" +
                    "</div>";
        }

        String supportPhone = data.getSupportPhone() != null ? data.getSupportPhone() : "+91 90323 06961";
        String supportEmail = data.getSupportEmail() != null ? data.getSupportEmail() : "support@pragathisweets.com";

        return "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
                "<body style=\"margin: 0; padding: 20px; background-color: #FFFDF8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EADDC9; box-shadow: 0 4px 15px rgba(139,0,0,0.05); overflow: hidden;\">" +
                "  <tr>" +
                "    <td style=\"background: linear-gradient(135deg, #8B0000 0%, #5B0000 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;\">" +
                "      <h1 style=\"margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px; color: #FFFDF8;\">PRAGATHI SWEETS</h1>" +
                "      <p style=\"margin: 4px 0 0 0; font-size: 13px; color: #EADDC9; letter-spacing: 2px; text-transform: uppercase;\">Taste The Tradition</p>" +
                "      <div style=\"display: inline-block; margin-top: 15px; background: rgba(255,255,255,0.18); padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: bold;\">" +
                "        " + statusBadge +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"padding: 24px 28px;\">" +
                "      <h2 style=\"margin: 0 0 10px 0; color: #8B0000; font-size: 18px;\">" + escapeHtml(title) + "</h2>" +
                "      <p style=\"margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.6;\">" +
                "        " + introMessage +
                "      </p>" +
                "      <table width=\"100%\" style=\"background-color: #FAF6EE; border-radius: 12px; padding: 16px; margin-bottom: 24px;\">" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Order Number:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 14px; color: #8B0000; font-weight: bold;\">#" + escapeHtml(data.getOrderNumber()) + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Order Date:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #333;\">" + escapeHtml(data.getOrderDate()) + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Payment Mode:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #333;\">" + paymentDisplay + " (" + escapeHtml(paymentStatusStr) + ")</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #666;\"><strong>Contact Phone:</strong></td>" +
                "          <td style=\"padding: 4px 8px; font-size: 13px; color: #333;\">" + escapeHtml(data.getCustomerPhone() != null ? data.getCustomerPhone() : "-") + "</td>" +
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
                "      <table align=\"right\" style=\"width: 270px; margin-bottom: 24px; font-size: 13px;\">" +
                "        <tr><td style=\"padding: 4px 0; color: #666;\">Subtotal:</td><td style=\"padding: 4px 0; text-align: right; color: #333;\">₹" + formatMoney(data.getSubtotal()) + "</td></tr>" +
                discountRow +
                "        <tr><td style=\"padding: 4px 0; color: #666;\">Delivery:</td><td style=\"padding: 4px 0; text-align: right;\">" + deliveryDisplay + "</td></tr>" +
                "        <tr style=\"border-top: 1px solid #DDD;\"><td style=\"padding: 8px 0; font-size: 16px; font-weight: bold; color: #8B0000;\">Total:</td><td style=\"padding: 8px 0; text-align: right; font-size: 16px; font-weight: bold; color: #8B0000;\">₹" + formatMoney(data.getGrandTotal()) + "</td></tr>" +
                "      </table>" +
                "      <div style=\"clear: both;\"></div>" +
                "      <div style=\"background-color: #FAF6EE; border-left: 4px solid #B8860B; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;\">" +
                "        <strong style=\"color: #8B0000; font-size: 13px;\">📍 Delivery Address:</strong>" +
                "        <p style=\"margin: 4px 0 0 0; font-size: 13px; color: #444;\">" + escapeHtml(data.getDeliveryAddress() != null ? data.getDeliveryAddress() : "-") + "</p>" +
                "      </div>" +
                trackingBtn +
                "      <div style=\"text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #EEE;\">" +
                "        <p style=\"margin: 0 0 6px 0; font-size: 13px; color: #777;\">Estimated Delivery: 2–4 Business Days</p>" +
                "        <p style=\"margin: 0; font-size: 12px; color: #888;\">Need assistance? Email <a href=\"mailto:" + escapeHtml(supportEmail) + "\" style=\"color: #8B0000; text-decoration: none;\">" + escapeHtml(supportEmail) + "</a> or call/WhatsApp <strong style=\"color: #075E54;\">" + escapeHtml(supportPhone) + "</strong></p>" +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"background-color: #F8F3EA; padding: 16px; text-align: center; font-size: 12px; color: #8A7A6D;\">" +
                "      © Pragathi Sweets • Taste the Tradition • All rights reserved." +
                "    </td>" +
                "  </tr>" +
                "</table></body></html>";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Email HTML
    // ─────────────────────────────────────────────────────────────────────────
    private String renderAdminOrderEmail(OrderEmailData data, String title, String message) {
        StringBuilder itemsHtml = new StringBuilder();
        if (data.getItems() != null) {
            for (OrderEmailData.ItemData item : data.getItems()) {
                itemsHtml.append("<tr>")
                        .append("<td style=\"padding: 8px 10px; border-bottom: 1px solid #EEE; font-size: 13px;\"><strong>").append(escapeHtml(item.getProductName())).append("</strong></td>")
                        .append("<td style=\"padding: 8px 10px; border-bottom: 1px solid #EEE; text-align: center; font-size: 13px;\">").append(item.getQuantity()).append("</td>")
                        .append("<td style=\"padding: 8px 10px; border-bottom: 1px solid #EEE; text-align: right; font-size: 13px;\">₹").append(formatMoney(item.getUnitPrice())).append("</td>")
                        .append("<td style=\"padding: 8px 10px; border-bottom: 1px solid #EEE; text-align: right; font-size: 13px; font-weight: bold; color: #8B0000;\">₹").append(formatMoney(item.getTotal())).append("</td>")
                        .append("</tr>");
            }
        }

        return "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\"></head>" +
                "<body style=\"margin: 0; padding: 20px; background-color: #F4F6F8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;\">" +
                "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 620px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #D0D7DE; overflow: hidden;\">" +
                "  <tr>" +
                "    <td style=\"background: #1B2A4A; padding: 24px; text-align: left; color: #FFFFFF;\">" +
                "      <span style=\"display: inline-block; background: #E65100; color: #FFFFFF; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;\">Store Dispatch Alert</span>" +
                "      <h2 style=\"margin: 0; font-size: 20px; color: #FFFFFF;\">🔔 New Order #" + escapeHtml(data.getOrderNumber()) + "</h2>" +
                "      <p style=\"margin: 4px 0 0 0; font-size: 13px; color: #CFD8DC;\">Order Total: ₹" + formatMoney(data.getGrandTotal()) + " | Method: " + escapeHtml(data.getPaymentMethod()) + " (" + escapeHtml(data.getPaymentStatus()) + ")</p>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"padding: 24px;\">" +
                "      <h3 style=\"margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #546E7A; letter-spacing: 0.5px;\">Customer & Shipping Information</h3>" +
                "      <table width=\"100%\" style=\"background-color: #F8F9FA; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px;\">" +
                "        <tr><td style=\"padding: 4px 0; color: #666; width: 130px;\"><strong>Customer Name:</strong></td><td style=\"padding: 4px 0; color: #222;\">" + escapeHtml(data.getCustomerName()) + "</td></tr>" +
                "        <tr><td style=\"padding: 4px 0; color: #666;\"><strong>Customer Email:</strong></td><td style=\"padding: 4px 0; color: #222;\"><a href=\"mailto:" + escapeHtml(data.getCustomerEmail()) + "\">" + escapeHtml(data.getCustomerEmail()) + "</a></td></tr>" +
                "        <tr><td style=\"padding: 4px 0; color: #666;\"><strong>Customer Phone:</strong></td><td style=\"padding: 4px 0; color: #222;\"><a href=\"tel:" + escapeHtml(data.getCustomerPhone()) + "\">" + escapeHtml(data.getCustomerPhone()) + "</a></td></tr>" +
                "        <tr><td style=\"padding: 4px 0; color: #666;\"><strong>Delivery Address:</strong></td><td style=\"padding: 4px 0; color: #222;\">" + escapeHtml(data.getDeliveryAddress()) + "</td></tr>" +
                "        <tr><td style=\"padding: 4px 0; color: #666;\"><strong>Order Timestamp:</strong></td><td style=\"padding: 4px 0; color: #222;\">" + escapeHtml(data.getOrderDate()) + "</td></tr>" +
                "      </table>" +
                "      <h3 style=\"margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #546E7A; letter-spacing: 0.5px;\">Order Items</h3>" +
                "      <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse: collapse; margin-bottom: 20px;\">" +
                "        <thead>" +
                "          <tr style=\"background-color: #ECEFF1;\">" +
                "            <th style=\"padding: 8px 10px; text-align: left; font-size: 12px; color: #37474F;\">Item</th>" +
                "            <th style=\"padding: 8px 10px; text-align: center; font-size: 12px; color: #37474F;\">Qty</th>" +
                "            <th style=\"padding: 8px 10px; text-align: right; font-size: 12px; color: #37474F;\">Price</th>" +
                "            <th style=\"padding: 8px 10px; text-align: right; font-size: 12px; color: #37474F;\">Total</th>" +
                "          </tr>" +
                "        </thead>" +
                "        <tbody>" + itemsHtml + "</tbody>" +
                "      </table>" +
                "      <div style=\"text-align: right; font-size: 14px; font-weight: bold; color: #8B0000; padding: 12px 0; border-top: 2px solid #ECEFF1;\">" +
                "        Grand Total: ₹" + formatMoney(data.getGrandTotal()) +
                "      </div>" +
                "    </td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td style=\"background-color: #ECEFF1; padding: 12px; text-align: center; font-size: 11px; color: #607D8B;\">" +
                "      Pragathi Sweets Admin Notification Engine • Internal Use Only" +
                "    </td>" +
                "  </tr>" +
                "</table></body></html>";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Plain Text Builders
    // ─────────────────────────────────────────────────────────────────────────
    private String renderOrderPlainText(OrderEmailData data, String header, String introMessage) {
        StringBuilder sb = new StringBuilder();
        sb.append("PRAGATHI SWEETS — ").append(header).append("\n");
        sb.append("====================================================\n\n");
        sb.append(introMessage).append("\n\n");
        sb.append("Order Number: #").append(data.getOrderNumber()).append("\n");
        sb.append("Order Date: ").append(data.getOrderDate()).append("\n");
        sb.append("Customer: ").append(data.getCustomerName()).append("\n");
        sb.append("Payment Mode: ").append(data.getPaymentMethod()).append(" (").append(data.getPaymentStatus()).append(")\n");
        sb.append("Delivery Address: ").append(data.getDeliveryAddress()).append("\n\n");
        sb.append("Items Ordered:\n");
        if (data.getItems() != null) {
            for (OrderEmailData.ItemData item : data.getItems()) {
                sb.append("- ").append(item.getProductName())
                        .append(" x ").append(item.getQuantity())
                        .append(" = Rs. ").append(formatMoney(item.getTotal())).append("\n");
            }
        }
        sb.append("\nSubtotal: Rs. ").append(formatMoney(data.getSubtotal())).append("\n");
        if (data.getDiscount() != null && data.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            sb.append("Discount: -Rs. ").append(formatMoney(data.getDiscount())).append("\n");
        }
        sb.append("Delivery: Rs. ").append(formatMoney(data.getDeliveryCharge())).append("\n");
        sb.append("Grand Total: Rs. ").append(formatMoney(data.getGrandTotal())).append("\n\n");
        sb.append("Support: Email ").append(data.getSupportEmail() != null ? data.getSupportEmail() : "support@agvia.in")
                .append(" or Phone ").append(data.getSupportPhone() != null ? data.getSupportPhone() : "+91 90323 06961").append("\n");
        sb.append("Thank you for choosing AGVIA Women's Wear Boutique!\n");
        return sb.toString();
    }

    private String renderAdminOrderPlainText(OrderEmailData data) {
        StringBuilder sb = new StringBuilder();
        sb.append("[ADMIN ALERT] NEW ORDER #").append(data.getOrderNumber()).append("\n");
        sb.append("====================================================\n\n");
        sb.append("Customer: ").append(data.getCustomerName()).append("\n");
        sb.append("Email: ").append(data.getCustomerEmail()).append("\n");
        sb.append("Phone: ").append(data.getCustomerPhone()).append("\n");
        sb.append("Address: ").append(data.getDeliveryAddress()).append("\n");
        sb.append("Total: Rs. ").append(formatMoney(data.getGrandTotal())).append("\n");
        sb.append("Payment: ").append(data.getPaymentMethod()).append(" (").append(data.getPaymentStatus()).append(")\n");
        sb.append("Date: ").append(data.getOrderDate()).append("\n\n");
        sb.append("Items:\n");
        if (data.getItems() != null) {
            for (OrderEmailData.ItemData item : data.getItems()) {
                sb.append("- ").append(item.getProductName()).append(" x ").append(item.getQuantity()).append(" (Rs. ").append(formatMoney(item.getTotal())).append(")\n");
            }
        }
        return sb.toString();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
