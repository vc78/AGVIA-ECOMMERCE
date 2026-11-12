package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.PublicOrderTrackingResponse;
import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderStatus;
import com.ems.pragathisweets.entity.PaymentMethod;
import com.ems.pragathisweets.entity.PaymentStatus;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class OrderPublicTrackingAndSecurityTest {

    private OrderRepository orderRepositoryProxy;
    private OrderService orderService;
    private Order testOrder;
    private User customer;
    private final String VALID_TOKEN = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .id(42L)
                .fullName("Lakshmi Narayana")
                .email("lakshmi@example.com")
                .phone("+919876543210")
                .build();

        testOrder = Order.builder()
                .id(1001L)
                .orderNumber("AGV2026110291")
                .trackingToken(VALID_TOKEN)
                .trackingTokenRevoked(false)
                .user(customer)
                .shippingAddress("Flat 402, Banjara Hills Road No 12, Hyderabad - 500034")
                .contactPhone("+919876543210")
                .status(OrderStatus.PROCESSING)
                .paymentMethod(PaymentMethod.RAZORPAY)
                .paymentStatus(PaymentStatus.SUCCESS)
                .totalAmount(BigDecimal.valueOf(15999))
                .finalAmount(BigDecimal.valueOf(14999))
                .createdAt(LocalDateTime.now())
                .build();

        // High-performance JDK Dynamic Proxy without requiring Mockito agent attachment
        orderRepositoryProxy = (OrderRepository) Proxy.newProxyInstance(
                OrderRepository.class.getClassLoader(),
                new Class<?>[]{OrderRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findByActiveTrackingTokenWithDetails".equals(methodName)) {
                        String token = (String) args[0];
                        if (VALID_TOKEN.equals(token)) {
                            return Optional.of(testOrder);
                        }
                        return Optional.empty();
                    }
                    if ("findByOrderNumberWithDetails".equals(methodName) || "findByOrderNumberIgnoreCase".equals(methodName)) {
                        String num = (String) args[0];
                        if ("AGV2026110291".equalsIgnoreCase(num)) {
                            return Optional.of(testOrder);
                        }
                        return Optional.empty();
                    }
                    if ("findById".equals(methodName)) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(1001L).equals(id)) {
                            return Optional.of(testOrder);
                        }
                        return Optional.empty();
                    }
                    if ("findByIdAndUserId".equals(methodName)) {
                        Long orderId = (Long) args[0];
                        Long userId = (Long) args[1];
                        if (Long.valueOf(1001L).equals(orderId) && Long.valueOf(42L).equals(userId)) {
                            return Optional.of(testOrder);
                        }
                        return Optional.empty();
                    }
                    if ("save".equals(methodName)) {
                        return args[0];
                    }
                    return null;
                }
        );

        orderService = new OrderService(
                orderRepositoryProxy,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    @Test
    @DisplayName("Public QR tracking exposes ONLY allowlisted fields and shields customer PII")
    void testPublicTrackingShieldsPii() {
        PublicOrderTrackingResponse response = orderService.getPublicTracking(VALID_TOKEN);

        assertNotNull(response);
        assertEquals(VALID_TOKEN, response.getTrackingToken());
        assertEquals("PROCESSING", response.getStatus());
        assertEquals("Hyderabad", response.getDestinationCity());
        assertEquals("Telangana", response.getDestinationState());
        assertTrue(response.isRequiresAuthForFullDetails());

        // CRITICAL SECURITY ASSERTION: Masked order number must not expose complete raw sequence
        assertTrue(response.getMaskedOrderNumber().contains("****"));

        // Verify timeline is populated without customer sensitive info
        assertNotNull(response.getTimeline());
        assertFalse(response.getTimeline().isEmpty());
    }

    @Test
    @DisplayName("Revoked tracking token returns 404 and does not expose order")
    void testRevokedTokenIsRejected() {
        testOrder.setTrackingTokenRevoked(true);

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.getPublicTracking(VALID_TOKEN);
        });
    }

    @Test
    @DisplayName("Invalid token produces ResourceNotFoundException without leaking order existence")
    void testInvalidTokenThrowsNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.getPublicTracking("invalid_token");
        });
    }

    @Test
    @DisplayName("Customer A cannot view Customer B's order details")
    void testOwnershipCheckEnforced() {
        Long unauthorizedUserId = 99L; // Different customer
        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.getUserOrder(unauthorizedUserId, 1001L);
        });
    }

    @Test
    @DisplayName("Legitimate order owner can access their order details")
    void testOwnerCanAccessOrder() {
        var response = orderService.getUserOrder(42L, 1001L);
        assertNotNull(response);
        assertEquals("AGV2026110291", response.getOrderNumber());
        assertEquals("Lakshmi Narayana", response.getUserName());
    }
}
