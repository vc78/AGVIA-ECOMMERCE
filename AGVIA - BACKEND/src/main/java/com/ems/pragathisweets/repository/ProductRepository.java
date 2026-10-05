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

    List<Product> findByCategoryIdAndIdNotAndActiveTrue(Long categoryId, Long id, Pageable pageable);

    boolean existsBySkuIgnoreCase(String sku);

    Optional<Product> findBySkuIgnoreCase(String sku);
}

