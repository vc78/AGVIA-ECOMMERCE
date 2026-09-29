package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByIdAndUserId(Long id, Long userId);
    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("select coalesce(sum(o.finalAmount), 0) from Order o where o.paymentStatus = com.ems.pragathisweets.entity.PaymentStatus.SUCCESS " +
            "and o.createdAt between :start and :end")
    java.math.BigDecimal sumRevenueBetween(@org.springframework.data.repository.query.Param("start") LocalDateTime start,
                                            @org.springframework.data.repository.query.Param("end") LocalDateTime end);

    long countByStatus(OrderStatus status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("select count(o) from Order o where o.status not in (com.ems.pragathisweets.entity.OrderStatus.CANCELLED) " +
            "and o.createdAt between :start and :end")
    long countSuccessfulOrdersBetween(@org.springframework.data.repository.query.Param("start") LocalDateTime start,
                                      @org.springframework.data.repository.query.Param("end") LocalDateTime end);

    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as dateVal, COUNT(*) as countVal " +
                   "FROM orders WHERE status != 'CANCELLED' AND created_at BETWEEN :start AND :end " +
                   "GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')", nativeQuery = true)
    java.util.List<Object[]> findDailyOrdersBetween(@org.springframework.data.repository.query.Param("start") LocalDateTime start,
                                                    @org.springframework.data.repository.query.Param("end") LocalDateTime end);
}
