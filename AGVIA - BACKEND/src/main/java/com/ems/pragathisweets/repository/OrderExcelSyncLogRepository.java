package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.OrderExcelSyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderExcelSyncLogRepository extends JpaRepository<OrderExcelSyncLog, Long> {

    List<OrderExcelSyncLog> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<OrderExcelSyncLog> findTopByOrderBySyncedAtDesc();

    long countByStatus(String status);
}
