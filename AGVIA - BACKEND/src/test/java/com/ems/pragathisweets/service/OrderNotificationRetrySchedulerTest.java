package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderNotificationLog;
import com.ems.pragathisweets.repository.OrderNotificationLogRepository;
import com.ems.pragathisweets.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderNotificationRetrySchedulerTest {

    @Mock
    private OrderNotificationLogRepository notificationLogRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private OrderNotificationService orderNotificationService;

    @InjectMocks
    private OrderNotificationRetryScheduler retryScheduler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(retryScheduler, "maxAttempts", 3);
        ReflectionTestUtils.setField(retryScheduler, "retryEnabled", true);
    }

    @Test
    @DisplayName("Should return immediately when no failed notification logs exist")
    void testRetry_NoFailedLogs() {
        when(notificationLogRepository.findByStatusAndAttemptCountLessThan("FAILED", 3))
                .thenReturn(Collections.emptyList());

        retryScheduler.retryFailedNotifications();

        verify(orderRepository, never()).findById(anyLong());
        verify(orderNotificationService, never()).sendOrderConfirmedNotifications(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should mark log as ABANDONED when associated order does not exist")
    void testRetry_OrderDeleted() {
        OrderNotificationLog failedLog = OrderNotificationLog.builder()
                .id(1L)
                .orderId(999L)
                .eventType("ORDER_CONFIRMED_CUSTOMER")
                .status("FAILED")
                .attemptCount(1)
                .updatedAt(LocalDateTime.now().minusMinutes(10))
                .build();

        when(notificationLogRepository.findByStatusAndAttemptCountLessThan("FAILED", 3))
                .thenReturn(List.of(failedLog));
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        retryScheduler.retryFailedNotifications();

        verify(notificationLogRepository, times(1)).save(argThat(log ->
                "ABANDONED".equals(log.getStatus()) && log.getId().equals(1L)
        ));
        verify(orderNotificationService, never()).sendOrderConfirmedNotifications(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should skip retry if cooldown backoff is in effect")
    void testRetry_CooldownBackoff() {
        OrderNotificationLog recentFailedLog = OrderNotificationLog.builder()
                .id(2L)
                .orderId(100L)
                .eventType("ORDER_CONFIRMED_CUSTOMER")
                .status("FAILED")
                .attemptCount(1)
                .updatedAt(LocalDateTime.now().minusSeconds(30)) // less than 2 minutes ago
                .build();

        when(notificationLogRepository.findByStatusAndAttemptCountLessThan("FAILED", 3))
                .thenReturn(List.of(recentFailedLog));

        retryScheduler.retryFailedNotifications();

        verify(orderRepository, never()).findById(anyLong());
        verify(orderNotificationService, never()).sendOrderConfirmedNotifications(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should retry eligible order confirmation notification successfully")
    void testRetry_Success() {
        OrderNotificationLog failedLog = OrderNotificationLog.builder()
                .id(3L)
                .orderId(101L)
                .eventType("ORDER_CONFIRMED_CUSTOMER")
                .status("FAILED")
                .attemptCount(1)
                .updatedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        Order order = new Order();
        order.setId(101L);
        order.setOrderNumber("ORD-101");

        OrderResponse response = OrderResponse.builder()
                .id(101L)
                .orderNumber("ORD-101")
                .build();

        when(notificationLogRepository.findByStatusAndAttemptCountLessThan("FAILED", 3))
                .thenReturn(List.of(failedLog));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));
        when(orderService.toResponse(order)).thenReturn(response);

        retryScheduler.retryFailedNotifications();

        verify(orderNotificationService, times(1))
                .sendOrderConfirmedNotifications(eq(response), any(), any(), any());
    }
}
