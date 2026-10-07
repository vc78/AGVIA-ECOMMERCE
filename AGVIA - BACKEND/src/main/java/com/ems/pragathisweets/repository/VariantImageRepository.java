package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.VariantImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VariantImageRepository extends JpaRepository<VariantImage, Long> {

    List<VariantImage> findByVariantIdOrderBySortOrderAsc(Long variantId);

    void deleteByVariantId(Long variantId);
}
