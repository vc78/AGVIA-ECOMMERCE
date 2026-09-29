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

    @Query("SELECT FUNCTION('DATE', e.createdAt) as dateVal, e.eventType as typeVal, COUNT(e) as countVal " +
           "FROM AnalyticsEvent e WHERE e.createdAt BETWEEN :start AND :end " +
           "GROUP BY FUNCTION('DATE', e.createdAt), e.eventType " +
           "ORDER BY dateVal ASC")
    List<Object[]> findEventCountsGroupedByDateAndType(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', e.createdAt) as dateVal, COUNT(DISTINCT e.visitorId) as countVal " +
           "FROM AnalyticsEvent e WHERE e.createdAt BETWEEN :start AND :end " +
           "GROUP BY FUNCTION('DATE', e.createdAt) " +
           "ORDER BY dateVal ASC")
    List<Object[]> findVisitorsGroupedByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT e.pagePath as path, COUNT(e) as views " +
           "FROM AnalyticsEvent e WHERE e.eventType = 'PAGE_VIEW' AND e.pagePath IS NOT NULL AND e.createdAt BETWEEN :start AND :end " +
           "GROUP BY e.pagePath ORDER BY views DESC")
    List<Object[]> findTopPages(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    @Query("SELECT e.deviceType as device, COUNT(e) as total " +
           "FROM AnalyticsEvent e WHERE e.deviceType IS NOT NULL AND e.createdAt BETWEEN :start AND :end " +
           "GROUP BY e.deviceType ORDER BY total DESC")
    List<Object[]> findDeviceDistribution(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT e.referrer as ref, COUNT(e) as total " +
           "FROM AnalyticsEvent e WHERE e.referrer IS NOT NULL AND e.createdAt BETWEEN :start AND :end " +
           "GROUP BY e.referrer ORDER BY total DESC")
    List<Object[]> findTrafficSources(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT e.productId as pid, e.eventType as et, COUNT(e) as total " +
           "FROM AnalyticsEvent e WHERE e.productId IS NOT NULL AND e.createdAt BETWEEN :start AND :end " +
           "GROUP BY e.productId, e.eventType")
    List<Object[]> findProductEventAggregates(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<AnalyticsEvent> findTop30ByOrderByCreatedAtDesc();
}
