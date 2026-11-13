package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.AdminReturnDecisionRequest;
import com.ems.pragathisweets.dto.CreateReturnRequest;
import com.ems.pragathisweets.dto.ReturnRequestResponse;
import com.ems.pragathisweets.entity.*;
import com.ems.pragathisweets.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ReturnServiceTest {

    private ReturnRequestRepository returnRequestRepoProxy;
    private OrderRepository orderRepoProxy;
    private OrderItemRepository orderItemRepoProxy;
    private UserRepository userRepoProxy;
    private CouponRepository couponRepoProxy;
    private ReturnService returnService;

    private User patron;
    private User otherPatron;
    private Order deliveredOrder;
    private OrderItem item;
    private List<Coupon> savedCoupons;
    private List<ReturnRequest> savedReturns;

    @BeforeEach
    void setUp() {
        savedCoupons = new ArrayList<>();
        savedReturns = new ArrayList<>();

        patron = User.builder()
                .id(101L)
                .fullName("Bespoke Patron")
                .email("patron@agvia.test")
                .role(Role.ROLE_USER)
                .build();

        otherPatron = User.builder()
                .id(202L)
                .fullName("Other Patron")
                .email("other@agvia.test")
                .role(Role.ROLE_USER)
                .build();

        deliveredOrder = Order.builder()
                .id(501L)
                .orderNumber("AGV-202611-501")
                .user(patron)
                .status(OrderStatus.DELIVERED)
                .totalAmount(new BigDecimal("12000.00"))
                .finalAmount(new BigDecimal("12000.00"))
                .shippingAddress("Villa 44, Road 36, Jubilee Hills, Hyderabad")
                .createdAt(LocalDateTime.now().minusDays(2))
                .updatedAt(LocalDateTime.now().minusDays(2))
                .build();

        item = OrderItem.builder()
                .id(801L)
                .order(deliveredOrder)
                .productName("Royal Zardozi Silk Ensemble")
                .price(new BigDecimal("12000.00"))
                .quantity(1)
                .subtotal(new BigDecimal("12000.00"))
                .build();

        // 1. ReturnRequestRepository Proxy
        returnRequestRepoProxy = (ReturnRequestRepository) Proxy.newProxyInstance(
                ReturnRequestRepository.class.getClassLoader(),
                new Class<?>[]{ReturnRequestRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        ReturnRequest r = (ReturnRequest) args[0];
                        if (r.getId() == null) r.setId((long) (savedReturns.size() + 1));
                        savedReturns.add(r);
                        return r;
                    }
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        return savedReturns.stream().filter(r -> id.equals(r.getId())).findFirst();
                    }
                    if ("existsByOrderIdAndStatusNotIn".equals(name)) {
                        return false;
                    }
                    return null;
                }
        );

        // 2. OrderRepository Proxy
        orderRepoProxy = (OrderRepository) Proxy.newProxyInstance(
                OrderRepository.class.getClassLoader(),
                new Class<?>[]{OrderRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(501L).equals(id)) {
                            return Optional.of(deliveredOrder);
                        }
                        return Optional.empty();
                    }
                    return null;
                }
        );

        // 3. OrderItemRepository Proxy
        orderItemRepoProxy = (OrderItemRepository) Proxy.newProxyInstance(
                OrderItemRepository.class.getClassLoader(),
                new Class<?>[]{OrderItemRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(801L).equals(id)) {
                            return Optional.of(item);
                        }
                        return Optional.empty();
                    }
                    return null;
                }
        );

        // 4. UserRepository Proxy
        userRepoProxy = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(101L).equals(id)) return Optional.of(patron);
                        if (Long.valueOf(202L).equals(id)) return Optional.of(otherPatron);
                        return Optional.empty();
                    }
                    return null;
                }
        );

        // 5. CouponRepository Proxy
        couponRepoProxy = (CouponRepository) Proxy.newProxyInstance(
                CouponRepository.class.getClassLoader(),
                new Class<?>[]{CouponRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        Coupon c = (Coupon) args[0];
                        savedCoupons.add(c);
                        return c;
                    }
                    if ("existsByCodeIgnoreCase".equals(name)) {
                        return false;
                    }
                    return null;
                }
        );

        returnService = new ReturnService(
                returnRequestRepoProxy,
                orderRepoProxy,
                orderItemRepoProxy,
                userRepoProxy,
                couponRepoProxy,
                new ObjectMapper()
        );
    }

    @Test
    @DisplayName("Should successfully create a return request for delivered order within 7 days")
    void testCreateReturnRequestSuccess() {
        CreateReturnRequest req = CreateReturnRequest.builder()
                .orderId(501L)
                .orderItemId(801L)
                .type("EXCHANGE")
                .reason("SIZE_FIT")
                .resolution("SIZE_EXCHANGE")
                .targetSize("XL")
                .customerNotes("Need one size larger around the waist.")
                .pickupAddress("Villa 44, Jubilee Hills, Hyderabad")
                .build();

        ReturnRequestResponse response = returnService.createReturnRequest(101L, req);

        assertNotNull(response);
        assertNotNull(response.getReturnNumber());
        assertTrue(response.getReturnNumber().startsWith("RET-"));
        assertEquals("EXCHANGE", response.getType());
        assertEquals("SIZE_FIT", response.getReason());
        assertEquals("SIZE_EXCHANGE", response.getResolution());
        assertEquals("REQUESTED", response.getStatus());
        assertEquals("XL", response.getTargetSize());
        assertEquals(new BigDecimal("12000.00"), response.getRefundAmount());
    }

    @Test
    @DisplayName("Should reject return request if user is not the order owner")
    void testCreateReturnForbiddenForNonOwner() {
        CreateReturnRequest req = CreateReturnRequest.builder()
                .orderId(501L)
                .type("RETURN")
                .reason("COLOR_MISMATCH")
                .resolution("STORE_CREDIT")
                .build();

        assertThrows(AccessDeniedException.class, () -> {
            returnService.createReturnRequest(202L, req);
        });
    }

    @Test
    @DisplayName("Should reject return request if order is not delivered")
    void testCreateReturnFailsForNonDeliveredOrder() {
        deliveredOrder.setStatus(OrderStatus.SHIPPED);

        CreateReturnRequest req = CreateReturnRequest.builder()
                .orderId(501L)
                .type("RETURN")
                .reason("DEFECTIVE")
                .resolution("ORIGINAL_PAYMENT")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            returnService.createReturnRequest(101L, req);
        });
        assertTrue(ex.getMessage().contains("delivered"));
    }

    @Test
    @DisplayName("Should reject return request if 7-day policy window has elapsed")
    void testCreateReturnFailsPastPolicyWindow() {
        deliveredOrder.setUpdatedAt(LocalDateTime.now().minusDays(10));
        deliveredOrder.setCreatedAt(LocalDateTime.now().minusDays(10));

        CreateReturnRequest req = CreateReturnRequest.builder()
                .orderId(501L)
                .type("RETURN")
                .reason("SIZE_FIT")
                .resolution("STORE_CREDIT")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            returnService.createReturnRequest(101L, req);
        });
        assertTrue(ex.getMessage().contains("7-day return policy window"));
    }

    @Test
    @DisplayName("Admin scheduling pickup auto-assigns reverse courier and tracking AWB")
    void testAdminPickupScheduledAutoAssignsCourier() {
        ReturnRequest existing = ReturnRequest.builder()
                .id(1L)
                .returnNumber("RET-20261113-ABCDEF")
                .order(deliveredOrder)
                .user(patron)
                .type(ReturnType.RETURN)
                .reason(ReturnReason.SIZE_FIT)
                .resolution(ReturnResolution.ORIGINAL_PAYMENT)
                .status(ReturnStatus.APPROVED)
                .refundAmount(new BigDecimal("12000.00"))
                .build();
        savedReturns.add(existing);

        AdminReturnDecisionRequest decision = AdminReturnDecisionRequest.builder()
                .status("PICKUP_SCHEDULED")
                .adminNotes("Courier partner dispatched for doorstep garment packaging.")
                .build();

        ReturnRequestResponse response = returnService.updateReturnDecision(1L, decision);

        assertEquals("PICKUP_SCHEDULED", response.getStatus());
        assertNotNull(response.getReverseCourierPartner());
        assertTrue(response.getReverseCourierPartner().contains("Blue Dart"));
        assertNotNull(response.getReverseTrackingNumber());
        assertTrue(response.getReverseTrackingNumber().startsWith("AGV-REV-"));
    }

    @Test
    @DisplayName("Admin completing store credit return issues unique privilege coupon with +5% bonus")
    void testAdminCompleteReturnIssuesStoreCreditCoupon() {
        ReturnRequest existing = ReturnRequest.builder()
                .id(2L)
                .returnNumber("RET-20261113-GHIJKL")
                .order(deliveredOrder)
                .user(patron)
                .type(ReturnType.RETURN)
                .reason(ReturnReason.NOT_AS_EXPECTED)
                .resolution(ReturnResolution.STORE_CREDIT)
                .status(ReturnStatus.RECEIVED)
                .refundAmount(new BigDecimal("10000.00"))
                .build();
        savedReturns.add(existing);

        AdminReturnDecisionRequest decision = AdminReturnDecisionRequest.builder()
                .status("COMPLETED")
                .issueStoreCreditCoupon(true)
                .adminNotes("Garment verified in pristine condition. Issued store credit.")
                .build();

        ReturnRequestResponse response = returnService.updateReturnDecision(2L, decision);

        assertEquals("COMPLETED", response.getStatus());
        assertNotNull(response.getCreditCouponCode());
        assertTrue(response.getCreditCouponCode().startsWith("PRIV-"));

        assertEquals(1, savedCoupons.size());
        Coupon savedCoupon = savedCoupons.get(0);

        assertEquals(response.getCreditCouponCode(), savedCoupon.getCode());
        // 10000 + 5% bonus (500) = 10500.00
        assertEquals(new BigDecimal("10500.00"), savedCoupon.getDiscountValue());
        assertEquals(DiscountType.FLAT, savedCoupon.getDiscountType());
        assertEquals(1, savedCoupon.getUsageLimit());
        assertTrue(savedCoupon.isActive());
    }
}
