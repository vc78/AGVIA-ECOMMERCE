package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.analytics.*;
import com.ems.pragathisweets.entity.AnalyticsEvent;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.repository.AnalyticsEventRepository;
import com.ems.pragathisweets.repository.OrderItemRepository;
import com.ems.pragathisweets.repository.OrderRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebsiteAnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    /**
     * Non-blocking ingestion of analytics events.
     * Sanitizes inputs to prevent storage of unnecessary or oversized personal information.
     */
    @Transactional
    public void recordEvent(AnalyticsTrackRequest req, Long authenticatedUserId) {
        try {
            if (req == null || req.getEventType() == null || req.getEventType().trim().isEmpty()) {
                return;
            }

            String eventType = sanitize(req.getEventType().trim().toUpperCase(), 50);
            String visitorId = sanitize(req.getVisitorId(), 64);
            if (visitorId == null) {
                visitorId = "anon-" + UUID.randomUUID().toString().substring(0, 18);
            }

            String sessionId = sanitize(req.getSessionId(), 64);
            if (sessionId == null) {
                sessionId = "sess-" + UUID.randomUUID().toString().substring(0, 18);
            }

            Long userId = authenticatedUserId != null ? authenticatedUserId : req.getUserId();
            String pagePath = sanitize(req.getPagePath(), 255);
            String pageTitle = sanitize(req.getPageTitle(), 150);
            String referrer = normalizeReferrer(req.getReferrer());
            String deviceType = normalizeDeviceType(req.getDeviceType());
            String shareMethod = sanitize(req.getShareMethod(), 30);
            Integer qty = req.getQuantity() != null && req.getQuantity() > 0 ? req.getQuantity() : 1;

            AnalyticsEvent event = AnalyticsEvent.builder()
                    .eventType(eventType)
                    .visitorId(visitorId)
                    .sessionId(sessionId)
                    .userId(userId)
                    .productId(req.getProductId())
                    .pagePath(pagePath)
                    .pageTitle(pageTitle)
                    .referrer(referrer)
                    .deviceType(deviceType)
                    .shareMethod(shareMethod)
                    .quantity(qty)
                    .createdAt(LocalDateTime.now())
                    .build();

            analyticsEventRepository.save(event);
        } catch (Exception ex) {
            log.warn("Failed to record analytics event: {}", ex.getMessage());
        }
    }

    /**
     * Overview KPI cards aggregated directly in the database.
     */
    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse getOverview(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        long visitors = analyticsEventRepository.countDistinctVisitorsBetween(start, end);
        long sessions = analyticsEventRepository.countDistinctSessionsBetween(start, end);
        long pageViews = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("PAGE_VIEW", start, end);
        long productViews = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("PRODUCT_VIEW", start, end);
        long addToCart = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("ADD_TO_CART", start, end);
        long shares = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("PRODUCT_SHARE", start, end);
        long checkouts = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("CHECKOUT_STARTED", start, end);

        // Authoritative orders and revenue from the existing order system
        long orders = orderRepository.countSuccessfulOrdersBetween(start, end);
        BigDecimal revenue = orderRepository.sumRevenueBetween(start, end);
        if (revenue == null) {
            revenue = BigDecimal.ZERO;
        }

        double viewToCartPct = productViews > 0 ? roundPct((double) addToCart / productViews * 100.0) : 0.0;
        double cartToCheckoutPct = addToCart > 0 ? roundPct((double) checkouts / addToCart * 100.0) : 0.0;
        double checkoutToOrderPct = checkouts > 0 ? roundPct((double) orders / checkouts * 100.0) : 0.0;
        double overallConversionPct = visitors > 0 ? roundPct((double) orders / visitors * 100.0) : 0.0;

        return AnalyticsOverviewResponse.builder()
                .visitors(visitors)
                .sessions(sessions)
                .pageViews(pageViews)
                .productViews(productViews)
                .addToCart(addToCart)
                .shares(shares)
                .checkouts(checkouts)
                .orders(orders)
                .revenue(revenue)
                .viewToCartPct(viewToCartPct)
                .cartToCheckoutPct(cartToCheckoutPct)
                .checkoutToOrderPct(checkoutToOrderPct)
                .overallConversionPct(overallConversionPct)
                .build();
    }

    /**
     * Daily trend metrics aggregated by database date group.
     */
    @Transactional(readOnly = true)
    public List<AnalyticsTrendItem> getTrends(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        Map<String, AnalyticsTrendItem> map = new LinkedHashMap<>();
        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            String dStr = curr.toString();
            map.put(dStr, AnalyticsTrendItem.builder()
                    .date(dStr)
                    .visitors(0)
                    .pageViews(0)
                    .productViews(0)
                    .addToCart(0)
                    .checkouts(0)
                    .orders(0)
                    .revenue(BigDecimal.ZERO)
                    .build());
            curr = curr.plusDays(1);
        }

        // Fill visitors per date
        List<Object[]> visitorsList = analyticsEventRepository.findVisitorsGroupedByDate(start, end);
        for (Object[] row : visitorsList) {
            if (row != null && row.length >= 2 && row[0] != null) {
                String dStr = row[0].toString().trim();
                if (dStr.length() > 10) dStr = dStr.substring(0, 10);
                long count = ((Number) row[1]).longValue();
                AnalyticsTrendItem item = map.get(dStr);
                if (item != null) {
                    item.setVisitors(count);
                }
            }
        }

        // Fill events per date and type
        List<Object[]> eventsList = analyticsEventRepository.findEventCountsGroupedByDateAndType(start, end);
        for (Object[] row : eventsList) {
            if (row != null && row.length >= 3 && row[0] != null && row[1] != null) {
                String dStr = row[0].toString().trim();
                if (dStr.length() > 10) dStr = dStr.substring(0, 10);
                String type = row[1].toString();
                long count = ((Number) row[2]).longValue();

                AnalyticsTrendItem item = map.get(dStr);
                if (item != null) {
                    if ("PAGE_VIEW".equalsIgnoreCase(type)) item.setPageViews(count);
                    else if ("PRODUCT_VIEW".equalsIgnoreCase(type)) item.setProductViews(count);
                    else if ("ADD_TO_CART".equalsIgnoreCase(type)) item.setAddToCart(count);
                    else if ("CHECKOUT_STARTED".equalsIgnoreCase(type)) item.setCheckouts(count);
                }
            }
        }

        // Fill orders per date
        List<Object[]> ordersList = orderRepository.findDailyOrdersBetween(start, end);
        for (Object[] row : ordersList) {
            if (row != null && row.length >= 2 && row[0] != null) {
                String dStr = row[0].toString().trim();
                if (dStr.length() > 10) dStr = dStr.substring(0, 10);
                long count = ((Number) row[1]).longValue();
                AnalyticsTrendItem item = map.get(dStr);
                if (item != null) {
                    item.setOrders(count);
                }
            }
        }

        return new ArrayList<>(map.values());
    }

    /**
     * Top products analysis combining view counts, cart additions, shares, and orders.
     */
    @Transactional(readOnly = true)
    public List<TopProductAnalyticsItem> getTopProducts(LocalDate startDate, LocalDate endDate, int limit) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> rows = analyticsEventRepository.findProductEventAggregates(start, end);
        Map<Long, long[]> statsMap = new HashMap<>(); // [views, carts, shares]

        for (Object[] r : rows) {
            if (r != null && r.length >= 3 && r[0] != null && r[1] != null) {
                Long pid = ((Number) r[0]).longValue();
                String et = r[1].toString();
                long count = ((Number) r[2]).longValue();

                long[] arr = statsMap.computeIfAbsent(pid, k -> new long[3]);
                if ("PRODUCT_VIEW".equalsIgnoreCase(et)) arr[0] += count;
                else if ("ADD_TO_CART".equalsIgnoreCase(et)) arr[1] += count;
                else if ("PRODUCT_SHARE".equalsIgnoreCase(et)) arr[2] += count;
            }
        }

        // Fetch authoritative order counts per product
        List<Object[]> orderRows = orderItemRepository.countOrdersPerProductBetween(start, end);
        Map<Long, Long> productOrdersMap = new HashMap<>();
        for (Object[] r : orderRows) {
            if (r != null && r.length >= 2 && r[0] != null && r[1] != null) {
                productOrdersMap.put(((Number) r[0]).longValue(), ((Number) r[1]).longValue());
            }
        }

        // Map top products to actual Product entities
        List<TopProductAnalyticsItem> results = new ArrayList<>();
        for (Map.Entry<Long, long[]> entry : statsMap.entrySet()) {
            Long pid = entry.getKey();
            long[] counts = entry.getValue();

            Optional<Product> prodOpt = productRepository.findById(pid);
            if (prodOpt.isPresent()) {
                Product p = prodOpt.get();
                long pOrders = productOrdersMap.getOrDefault(pid, 0L);
                results.add(TopProductAnalyticsItem.builder()
                        .productId(p.getId())
                        .productName(p.getName())
                        .imageUrl(p.getImageUrl())
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Atelier Couture")
                        .price(p.getPrice())
                        .views(counts[0])
                        .carts(counts[1])
                        .addToCart(counts[1])
                        .shares(counts[2])
                        .orders(pOrders)
                        .build());
            }
        }

        results.sort((a, b) -> {
            int cmp = Long.compare(b.getViews(), a.getViews());
            if (cmp != 0) return cmp;
            return Long.compare(b.getOrders(), a.getOrders());
        });

        if (results.size() > limit) {
            return results.subList(0, limit);
        }
        return results;
    }

    /**
     * Top visited public pages.
     */
    @Transactional(readOnly = true)
    public List<TopPageItem> getTopPages(LocalDate startDate, LocalDate endDate, int limit) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> rows = analyticsEventRepository.findTopPagesNative(start, end, limit);
        long totalViews = 0;
        for (Object[] r : rows) {
            if (r != null && r.length >= 2 && r[1] != null) {
                totalViews += ((Number) r[1]).longValue();
            }
        }

        List<TopPageItem> list = new ArrayList<>();
        for (Object[] r : rows) {
            if (r != null && r.length >= 2 && r[0] != null) {
                String path = r[0].toString();
                long views = ((Number) r[1]).longValue();
                double pct = totalViews > 0 ? roundPct((double) views / totalViews * 100.0) : 0.0;
                list.add(TopPageItem.builder()
                        .pagePath(path)
                        .views(views)
                        .percentage(pct)
                        .build());
            }
        }
        return list;
    }

    /**
     * Device breakdown: Mobile, Tablet, Desktop.
     */
    @Transactional(readOnly = true)
    public List<DeviceStatsItem> getDeviceStats(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> rows = analyticsEventRepository.findDeviceDistribution(start, end);
        long total = 0;
        Map<String, Long> countMap = new LinkedHashMap<>();
        countMap.put("Mobile", 0L);
        countMap.put("Desktop", 0L);
        countMap.put("Tablet", 0L);

        for (Object[] r : rows) {
            if (r != null && r.length >= 2 && r[0] != null) {
                String dev = r[0].toString();
                long c = ((Number) r[1]).longValue();
                total += c;
                countMap.put(dev, countMap.getOrDefault(dev, 0L) + c);
            }
        }

        List<DeviceStatsItem> result = new ArrayList<>();
        for (Map.Entry<String, Long> e : countMap.entrySet()) {
            double pct = total > 0 ? roundPct((double) e.getValue() / total * 100.0) : 0.0;
            result.add(DeviceStatsItem.builder()
                    .deviceType(e.getKey())
                    .count(e.getValue())
                    .percentage(pct)
                    .build());
        }
        return result;
    }

    /**
     * Traffic sources (Direct, Google, Social, etc.).
     */
    @Transactional(readOnly = true)
    public List<TrafficSourceItem> getTrafficSources(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> rows = analyticsEventRepository.findTrafficSources(start, end);
        long total = 0;
        Map<String, Long> map = new LinkedHashMap<>();

        for (Object[] r : rows) {
            if (r != null && r.length >= 2 && r[0] != null) {
                String src = r[0].toString();
                long c = ((Number) r[1]).longValue();
                total += c;
                map.put(src, map.getOrDefault(src, 0L) + c);
            }
        }

        if (map.isEmpty()) {
            map.put("Direct", 0L);
        }

        List<TrafficSourceItem> result = new ArrayList<>();
        for (Map.Entry<String, Long> e : map.entrySet()) {
            double pct = total > 0 ? roundPct((double) e.getValue() / total * 100.0) : 0.0;
            result.add(TrafficSourceItem.builder()
                    .source(e.getKey())
                    .count(e.getValue())
                    .percentage(pct)
                    .build());
        }
        return result;
    }

    /**
     * Multi-stage conversion funnel.
     */
    @Transactional(readOnly = true)
    public ConversionFunnelResponse getFunnel(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        long visitors = analyticsEventRepository.countDistinctVisitorsBetween(start, end);
        long productViews = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("PRODUCT_VIEW", start, end);
        long addToCart = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("ADD_TO_CART", start, end);
        long checkouts = analyticsEventRepository.countByEventTypeAndCreatedAtBetween("CHECKOUT_STARTED", start, end);
        long purchases = orderRepository.countSuccessfulOrdersBetween(start, end);

        double visitorsToViewsPct = visitors > 0 ? roundPct((double) productViews / visitors * 100.0) : 0.0;
        double viewsToCartPct = productViews > 0 ? roundPct((double) addToCart / productViews * 100.0) : 0.0;
        double cartToCheckoutsPct = addToCart > 0 ? roundPct((double) checkouts / addToCart * 100.0) : 0.0;
        double checkoutsToPurchasesPct = checkouts > 0 ? roundPct((double) purchases / checkouts * 100.0) : 0.0;
        double overallConversionPct = visitors > 0 ? roundPct((double) purchases / visitors * 100.0) : 0.0;

        return ConversionFunnelResponse.builder()
                .visitors(visitors)
                .productViews(productViews)
                .addToCart(addToCart)
                .checkouts(checkouts)
                .checkoutStarted(checkouts)
                .purchases(purchases)
                .visitorsToViewsPct(visitorsToViewsPct)
                .productViewRate(visitorsToViewsPct)
                .viewsToCartPct(viewsToCartPct)
                .cartRate(viewsToCartPct)
                .cartToCheckoutsPct(cartToCheckoutsPct)
                .checkoutRate(cartToCheckoutsPct)
                .checkoutsToPurchasesPct(checkoutsToPurchasesPct)
                .purchaseRate(checkoutsToPurchasesPct)
                .overallConversionPct(overallConversionPct)
                .overallConversionRate(overallConversionPct)
                .build();
    }

    /**
     * Recent activity feed (chronological stream of latest non-sensitive events).
     */
    @Transactional(readOnly = true)
    public List<RecentActivityItem> getRecentActivity(int limit) {
        List<AnalyticsEvent> events = analyticsEventRepository.findTop30ByOrderByCreatedAtDesc();
        List<RecentActivityItem> list = new ArrayList<>();

        for (AnalyticsEvent e : events) {
            String visitorLabel = e.getUserId() != null ? "Patron #" + e.getUserId() : "Anonymous visitor";
            String eventLabel = formatEventLabel(e.getEventType());
            String prodName = null;

            if (e.getProductId() != null) {
                Optional<Product> p = productRepository.findById(e.getProductId());
                if (p.isPresent()) {
                    prodName = p.get().getName();
                }
            }

            String desc = eventLabel;
            if (prodName != null && !prodName.isEmpty()) {
                desc += " · " + prodName;
            } else if (e.getPagePath() != null && !e.getPagePath().isEmpty()) {
                desc += " · " + e.getPagePath();
            }

            list.add(RecentActivityItem.builder()
                    .id(e.getId())
                    .eventType(e.getEventType())
                    .eventLabel(eventLabel)
                    .visitorLabel(visitorLabel)
                    .pagePath(e.getPagePath())
                    .productId(e.getProductId())
                    .productName(prodName)
                    .shareMethod(e.getShareMethod())
                    .deviceType(e.getDeviceType())
                    .timestamp(e.getCreatedAt())
                    .createdAt(e.getCreatedAt())
                    .description(desc)
                    .build());

            if (list.size() >= limit) break;
        }
        return list;
    }

    // ── Helper Utilities ────────────────────────────────────────────────────────

    private String sanitize(String str, int maxLen) {
        if (str == null) return null;
        String trimmed = str.trim();
        if (trimmed.length() > maxLen) {
            return trimmed.substring(0, maxLen);
        }
        return trimmed;
    }

    private String normalizeReferrer(String ref) {
        if (ref == null || ref.trim().isEmpty() || "null".equalsIgnoreCase(ref) || "undefined".equalsIgnoreCase(ref)) {
            return "Direct";
        }
        String lower = ref.toLowerCase().trim();
        if (lower.contains("google")) return "Google";
        if (lower.contains("instagram")) return "Instagram";
        if (lower.contains("facebook")) return "Facebook";
        if (lower.contains("whatsapp") || lower.contains("wa.me")) return "WhatsApp";
        if (lower.contains("youtube")) return "YouTube";
        if (lower.contains("pinterest")) return "Pinterest";
        if (lower.contains("twitter") || lower.contains("t.co") || lower.contains("x.com")) return "Twitter / X";
        return sanitize(ref, 60);
    }

    private String normalizeDeviceType(String dev) {
        if (dev == null || dev.trim().isEmpty()) return "Desktop";
        String lower = dev.toLowerCase().trim();
        if (lower.contains("mobile")) return "Mobile";
        if (lower.contains("tablet") || lower.contains("ipad")) return "Tablet";
        return "Desktop";
    }

    private String formatEventLabel(String eventType) {
        if (eventType == null) return "Activity";
        switch (eventType.toUpperCase()) {
            case "PAGE_VIEW": return "Viewed Page";
            case "PRODUCT_VIEW": return "Viewed Silhouette";
            case "ADD_TO_CART": return "Added to Bag";
            case "WISHLIST_ADD": return "Saved to Wishlist";
            case "WISHLIST_REMOVE": return "Removed from Wishlist";
            case "PRODUCT_SHARE": return "Shared Silhouette";
            case "CHECKOUT_STARTED": return "Started Checkout";
            case "PURCHASE": return "Completed Order";
            default: return eventType;
        }
    }

    private double roundPct(double val) {
        return BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
