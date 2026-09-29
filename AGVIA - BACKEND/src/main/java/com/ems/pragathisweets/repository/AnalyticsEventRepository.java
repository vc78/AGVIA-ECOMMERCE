package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.AnalyticsEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    @Query("SELECT COUNT(DISTINCT e.visitorId) FROM AnalyticsEvent e WHERE e.createdAt BETWEEN :start AND :end")
    long countDistinctVisitorsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT e.sessionId) FROM AnalyticsEvent e WHERE e.createdAt BETWEEN :start AND :end")
    long countDistinctSessionsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(e) FROM AnalyticsEvent e WHERE e.eventType = :eventType AND e.createdAt BETWEEN :start AND :end")
    long countByEventTypeAndCreatedAtBetween(@Param("eventType") String eventType, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as dateVal, event_type as typeVal, COUNT(*) as countVal " +
                   "FROM analytics_events WHERE created_at BETWEEN :start AND :end " +
                   "GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), event_type " +
                   "ORDER BY dateVal ASC", nativeQuery = true)
    List<Object[]> findEventCountsGroupedByDateAndType(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as dateVal, COUNT(DISTINCT visitor_id) as countVal " +
                   "FROM analytics_events WHERE created_at BETWEEN :start AND :end " +
                   "GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') " +
                   "ORDER BY dateVal ASC", nativeQuery = true)
    List<Object[]> findVisitorsGroupedByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT page_path as path, COUNT(*) as views " +
                   "FROM analytics_events WHERE event_type = 'PAGE_VIEW' AND page_path IS NOT NULL AND created_at BETWEEN :start AND :end " +
                   "GROUP BY page_path ORDER BY views DESC LIMIT :lim", nativeQuery = true)
    List<Object[]> findTopPagesNative(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("lim") int lim);

    @Query(value = "SELECT device_type as device, COUNT(*) as total " +
                   "FROM analytics_events WHERE device_type IS NOT NULL AND created_at BETWEEN :start AND :end " +
                   "GROUP BY device_type ORDER BY total DESC", nativeQuery = true)
    List<Object[]> findDeviceDistribution(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT referrer as ref, COUNT(*) as total " +
                   "FROM analytics_events WHERE referrer IS NOT NULL AND created_at BETWEEN :start AND :end " +
                   "GROUP BY referrer ORDER BY total DESC", nativeQuery = true)
    List<Object[]> findTrafficSources(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT product_id as pid, event_type as et, COUNT(*) as total " +
                   "FROM analytics_events WHERE product_id IS NOT NULL AND created_at BETWEEN :start AND :end " +
                   "GROUP BY product_id, event_type", nativeQuery = true)
    List<Object[]> findProductEventAggregates(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<AnalyticsEvent> findTop30ByOrderByCreatedAtDesc();
}
