package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("select oi.productName as name, sum(oi.quantity) as totalSold " +
            "from OrderItem oi group by oi.productName order by sum(oi.quantity) desc")
    List<ProductSalesProjection> findTopSellingProducts();

    @Query(value = "SELECT oi.product_id as pid, SUM(oi.quantity) as totalSold " +
                   "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.status != 'CANCELLED' AND oi.product_id IS NOT NULL AND o.created_at >= :since " +
                   "GROUP BY oi.product_id " +
                   "ORDER BY totalSold DESC", nativeQuery = true)
    List<Object[]> findBestSellingProductIds(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @Query(value = "SELECT oi.product_id as pid, SUM(oi.quantity) as totalSold " +
                   "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.status != 'CANCELLED' AND oi.product_id IS NOT NULL " +
                   "GROUP BY oi.product_id " +
                   "ORDER BY totalSold DESC", nativeQuery = true)
    List<Object[]> findBestSellingProductIdsAllTime();

    @Query(value = "SELECT oi.product_id as pid, COUNT(DISTINCT o.id) as orderCount " +
                   "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.status != 'CANCELLED' AND o.created_at BETWEEN :start AND :end AND oi.product_id IS NOT NULL " +
                   "GROUP BY oi.product_id", nativeQuery = true)
    List<Object[]> countOrdersPerProductBetween(@org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
                                                @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);

    interface ProductSalesProjection {
        String getName();
        Long getTotalSold();
    }
}
