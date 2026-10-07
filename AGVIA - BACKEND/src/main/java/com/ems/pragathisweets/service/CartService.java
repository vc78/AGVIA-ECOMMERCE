package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.CartItemRequest;
import com.ems.pragathisweets.dto.CartItemResponse;
import com.ems.pragathisweets.dto.CartResponse;
import com.ems.pragathisweets.entity.Cart;
import com.ems.pragathisweets.entity.CartItem;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.InsufficientStockException;
import com.ems.pragathisweets.exception.ProductNotFoundException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.CartItemRepository;
import com.ems.pragathisweets.repository.CartRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import com.ems.pragathisweets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final com.ems.pragathisweets.repository.ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    @Transactional
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

        if (!product.isActive()) {
            throw new ResourceNotFoundException("Product is not available: " + product.getName());
        }

        com.ems.pragathisweets.entity.ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found: " + request.getVariantId()));
            if (!variant.isActive()) {
                throw new ResourceNotFoundException("Variant is not available: " + variant.getColorName());
            }
        }

        // Match existing cart item with same product AND same variantId
        final Long reqVariantId = request.getVariantId();
        CartItem existingItem = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()) && java.util.Objects.equals(i.getVariantId(), reqVariantId))
                .findFirst()
                .orElse(null);

        int newQuantity = request.getQuantity() + (existingItem != null ? existingItem.getQuantity() : 0);

        int availableStock = (variant != null) ? variant.getStockQuantity() : product.getStockQuantity();
        if (availableStock < newQuantity) {
            String name = (variant != null) ? product.getName() + " (" + variant.getColorName() + ")" : product.getName();
            throw new InsufficientStockException("Only " + availableStock + " units of " + name + " are available in stock");
        }

        BigDecimal priceSnapshot = (variant != null)
                ? variant.getEffectivePrice(product.getEffectivePrice())
                : product.getEffectivePrice();

        String sku = (variant != null && variant.getSku() != null) ? variant.getSku() : product.getSku();
        String colorName = (variant != null) ? variant.getColorName() : request.getColorName();
        String imageUrl = (variant != null && variant.getPrimaryImage() != null)
                ? variant.getPrimaryImage().getImageUrl()
                : (request.getImageUrl() != null ? request.getImageUrl() : product.getImageUrl());

        if (existingItem != null) {
            existingItem.setQuantity(newQuantity);
            existingItem.setPriceSnapshot(priceSnapshot);
            existingItem.setImageUrl(imageUrl);
            cartItemRepository.save(existingItem);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .priceSnapshot(priceSnapshot)
                    .variantId(variant != null ? variant.getId() : null)
                    .colorName(colorName)
                    .sku(sku)
                    .imageUrl(imageUrl)
                    .build();
            cart.addItem(item);
            cartItemRepository.save(item);
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItem(Long userId, Long itemId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (quantity <= 0) {
            cart.removeItem(item);
            cartItemRepository.delete(item);
        } else {
            Product product = item.getProduct();
            if (product.getStockQuantity() < quantity) {
                throw new InsufficientStockException("Only " + product.getStockQuantity() + " units of "
                        + product.getName() + " are available in stock");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        cart.removeItem(item);
        cartItemRepository.delete(item);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    @Transactional
    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });
    }

    private CartResponse toResponse(Cart cart) {
        var items = cart.getItems().stream()
                .map(item -> {
                    String imgUrl = item.getImageUrl() != null ? item.getImageUrl() : item.getProduct().getImageUrl();
                    return CartItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productImageUrl(imgUrl)
                            .price(item.getPriceSnapshot())
                            .quantity(item.getQuantity())
                            .subtotal(item.getSubtotal())
                            .inStock(item.getProduct().isInStock())
                            .variantId(item.getVariantId())
                            .colorName(item.getColorName())
                            .sku(item.getSku())
                            .variantImageUrl(imgUrl)
                            .build();
                })
                .toList();

        BigDecimal total = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = items.stream().mapToInt(CartItemResponse::getQuantity).sum();

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(items)
                .totalAmount(total)
                .totalItems(totalItems)
                .build();
    }
}
