package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.exception.ProductNotFoundException;
import com.ems.pragathisweets.mapper.ProductMapper;
import com.ems.pragathisweets.repository.ProductRepository;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.inventory.low-stock-threshold:10}")
    private int lowStockThreshold;

    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findByStockQuantityLessThanEqualAndActiveTrue(lowStockThreshold).stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProductResponse adjustStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        if (quantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }

        product.setStockQuantity(quantity);
        Product saved = productRepository.save(product);
        checkAndPublishStockAlert(saved);
        return productMapper.toResponse(saved);
    }

    @Transactional
    public ProductResponse incrementStock(Long productId, int delta) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        int newQuantity = product.getStockQuantity() + delta;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Resulting stock quantity cannot be negative");
        }

        product.setStockQuantity(newQuantity);
        Product saved = productRepository.save(product);
        checkAndPublishStockAlert(saved);
        return productMapper.toResponse(saved);
    }

    private void checkAndPublishStockAlert(Product product) {
        if (product.getStockQuantity() == 0) {
            eventPublisher.publishEvent(new AdminNotificationEvent(
                    NotificationType.OUT_OF_STOCK,
                    "Product Out of Stock: " + product.getName(),
                    product.getName() + " is completely out of stock (0 units remaining)",
                    String.valueOf(product.getId()),
                    "PRODUCT",
                    Map.of(
                            "productId", product.getId(),
                            "productName", product.getName(),
                            "stockQuantity", 0
                    )
            ));
        } else if (product.getStockQuantity() <= lowStockThreshold) {
            eventPublisher.publishEvent(new AdminNotificationEvent(
                    NotificationType.LOW_STOCK,
                    "Low Stock Alert: " + product.getName(),
                    product.getName() + " has only " + product.getStockQuantity() + " units remaining",
                    String.valueOf(product.getId()),
                    "PRODUCT",
                    Map.of(
                            "productId", product.getId(),
                            "productName", product.getName(),
                            "stockQuantity", product.getStockQuantity(),
                            "threshold", lowStockThreshold
                    )
            ));
        }
    }
}
