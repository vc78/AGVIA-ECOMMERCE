package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.ProductCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductCollectionRepository extends JpaRepository<ProductCollection, Long> {

    Optional<ProductCollection> findBySlug(String slug);

    List<ProductCollection> findByActiveTrueOrderByDisplayOrderAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Query("SELECT c FROM ProductCollection c LEFT JOIN FETCH c.products WHERE c.slug = :slug AND c.active = true")
    Optional<ProductCollection> findBySlugWithProducts(@Param("slug") String slug);
}
