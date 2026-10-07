package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithPessimisticLock(@Param("id") Long id);

    Page<Product> findByActiveTrue(Pageable pageable);

    List<Product> findByActiveTrue();

    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    @Query("select p from Product p where p.active = true and " +
            "(lower(p.name) like lower(concat('%', :keyword, '%')) " +
            "or lower(p.description) like lower(concat('%', :keyword, '%')))")
    Page<Product> search(@Param("keyword") String keyword, Pageable pageable);

    List<Product> findTop8ByActiveTrueOrderByAvgRatingDesc();

    List<Product> findByStockQuantityLessThanEqualAndActiveTrue(Integer threshold);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stockQuantity <= p.lowStockThreshold AND p.stockQuantity > 0")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockQuantity <= p.lowStockThreshold AND p.stockQuantity > 0")
    long countLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stockQuantity = 0")
    List<Product> findOutOfStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockQuantity = 0")
    long countOutOfStockProducts();

    List<Product> findTop12ByActiveTrueOrderByCreatedAtDesc();

    List<Product> findTop12ByActiveTrueOrderByAvgRatingDesc();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.discountPrice IS NOT NULL AND p.discountPrice < p.price ORDER BY (p.price - p.discountPrice) DESC")
    List<Product> findByCategoryIdAndIdNotAndActiveTrue(Long categoryId, Long id, org.springframework.data.domain.Pageable pageable);

    boolean existsBySkuIgnoreCase(String sku);

    Optional<Product> findBySkuIgnoreCase(String sku);
}

