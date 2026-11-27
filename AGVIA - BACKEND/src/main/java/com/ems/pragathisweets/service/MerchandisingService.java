package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.HomepageDataResponse;
import com.ems.pragathisweets.dto.HomepageSectionResponse;
import com.ems.pragathisweets.dto.ProductCollectionResponse;
import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.entity.HomepageSection;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.entity.ProductCollection;
import com.ems.pragathisweets.entity.ProductVariant;
import com.ems.pragathisweets.mapper.ProductMapper;
import com.ems.pragathisweets.repository.HomepageSectionRepository;
import com.ems.pragathisweets.repository.OrderItemRepository;
import com.ems.pragathisweets.repository.ProductCollectionRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import com.ems.pragathisweets.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchandisingService {

    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductCollectionRepository productCollectionRepository;
    private final HomepageSectionRepository homepageSectionRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public List<ProductResponse> getBestSellers(int days, int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(days > 0 ? days : 30);
        List<Object[]> rows = orderItemRepository.findBestSellingProductIds(since);

        List<Long> rankedProductIds = new ArrayList<>();
        for (Object[] row : rows) {
            if (row[0] != null) {
                Long pid = ((Number) row[0]).longValue();
                rankedProductIds.add(pid);
            }
        }

        // Fallback: If not enough orders in window, backfill with all-time best sellers
        if (rankedProductIds.size() < limit) {
            List<Object[]> allTimeRows = orderItemRepository.findBestSellingProductIdsAllTime();
            for (Object[] row : allTimeRows) {
                if (row[0] != null) {
                    Long pid = ((Number) row[0]).longValue();
                    if (!rankedProductIds.contains(pid)) {
                        rankedProductIds.add(pid);
                    }
                }
            }
        }

        // Fetch products and preserve order
        Map<Long, Product> productMap = productRepository.findAllById(rankedProductIds).stream()
                .filter(Product::isActive)
                .collect(Collectors.toMap(Product::getId, p -> p));

        List<ProductResponse> result = new ArrayList<>();
        for (Long pid : rankedProductIds) {
            Product p = productMap.get(pid);
            if (p != null) {
                result.add(productMapper.toResponse(p));
                if (result.size() >= limit) break;
            }
        }

        // If still empty (e.g. fresh installation with 0 orders), use highest-rated active products
        if (result.isEmpty()) {
            result = productRepository.findTop8ByActiveTrueOrderByAvgRatingDesc().stream()
                    .map(productMapper::toResponse)
                    .limit(limit)
                    .collect(Collectors.toList());
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getTrending(int limit) {
        // Trending score: Orders over last 14 days + high ratings
        LocalDateTime since = LocalDateTime.now().minusDays(14);
        List<Object[]> rows = orderItemRepository.findBestSellingProductIds(since);
        Set<Long> trendingPids = new LinkedHashSet<>();

        for (Object[] row : rows) {
            if (row[0] != null) {
                trendingPids.add(((Number) row[0]).longValue());
            }
        }

        // Supplement with highest-rated active products
        List<Product> topRated = productRepository.findTop12ByActiveTrueOrderByAvgRatingDesc();
        for (Product p : topRated) {
            trendingPids.add(p.getId());
            if (trendingPids.size() >= limit * 2) break;
        }

        List<Product> products = productRepository.findAllById(trendingPids).stream()
                .filter(Product::isActive)
                .collect(Collectors.toList());

        // Sort by trending signal: inStock prioritized, rating desc
        products.sort(Comparator.comparing(Product::isInStock).reversed()
                .thenComparing(Product::getAvgRating, Comparator.nullsLast(Comparator.reverseOrder())));

        return products.stream()
                .limit(limit)
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getNewArrivals(int limit) {
        return productRepository.findTop12ByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(Product::isActive)
                .limit(limit)
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getLimitedStock(int limit) {
        // Products with stock > 0 and <= threshold
        List<Product> lowStock = productRepository.findLowStockProducts();
        
        // Also check variants with low stock
        List<ProductVariant> lowVariants = productVariantRepository.findLowStockVariants();
        Set<Long> productIdsWithLowStockVariants = lowVariants.stream()
                .map(v -> v.getProduct().getId())
                .collect(Collectors.toSet());

        Set<Product> combined = new LinkedHashSet<>(lowStock);
        if (!productIdsWithLowStockVariants.isEmpty()) {
            productRepository.findAllById(productIdsWithLowStockVariants).stream()
                    .filter(Product::isActive)
                    .forEach(combined::add);
        }

        return combined.stream()
                .limit(limit)
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HomepageDataResponse.ColorSwatchDto> getShopByColor() {
        List<ProductVariant> activeVariants = productVariantRepository.findAll().stream()
                .filter(v -> v.isActive() && v.getProduct() != null && v.getProduct().isActive())
                .collect(Collectors.toList());

        Map<String, List<ProductVariant>> grouped = activeVariants.stream()
                .collect(Collectors.groupingBy(v -> v.getColorName().trim()));

        List<HomepageDataResponse.ColorSwatchDto> swatches = new ArrayList<>();
        for (Map.Entry<String, List<ProductVariant>> entry : grouped.entrySet()) {
            String colorName = entry.getKey();
            List<ProductVariant> list = entry.getValue();
            String code = list.stream()
                    .map(ProductVariant::getColorCode)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse("#333333");

            // Count distinct products offering this color
            long productCount = list.stream().map(v -> v.getProduct().getId()).distinct().count();

            swatches.add(HomepageDataResponse.ColorSwatchDto.builder()
                    .colorName(colorName)
                    .colorCode(code)
                    .productCount((int) productCount)
                    .build());
        }

        swatches.sort(Comparator.comparingInt(HomepageDataResponse.ColorSwatchDto::getProductCount).reversed());
        return swatches;
    }

    @Transactional
    public HomepageDataResponse getAggregatedHomepageData() {
        ensureDefaultSectionsExist();

        List<HomepageSection> sections = homepageSectionRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .filter(HomepageSection::isCurrentlyActive)
                .collect(Collectors.toList());

        List<HomepageSectionResponse> sectionResponses = sections.stream()
                .map(s -> HomepageSectionResponse.builder()
                        .id(s.getId())
                        .sectionKey(s.getSectionKey())
                        .title(s.getTitle())
                        .subtitle(s.getSubtitle())
                        .displayOrder(s.getDisplayOrder())
                        .active(s.isActive())
                        .automatic(s.isAutomatic())
                        .maxItems(s.getMaxItems())
                        .startDate(s.getStartDate())
                        .endDate(s.getEndDate())
                        .customProductIds(s.getCustomProductIds())
                        .collectionId(s.getCollectionId())
                        .build())
                .collect(Collectors.toList());

        // Dynamic merchandised product lists
        List<ProductResponse> bestSellers = getBestSellers(30, 8);
        List<ProductResponse> trending = getTrending(8);
        List<ProductResponse> newArrivals = getNewArrivals(8);
        List<ProductResponse> limitedStock = getLimitedStock(8);
        List<ProductResponse> featured = productRepository.findTop8ByActiveTrueOrderByAvgRatingDesc().stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());

        // Collections
        List<ProductCollectionResponse> collectionResponses = productCollectionRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(c -> ProductCollectionResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .description(c.getDescription())
                        .coverImage(c.getCoverImage())
                        .bannerImage(c.getBannerImage())
                        .displayOrder(c.getDisplayOrder())
                        .active(c.isActive())
                        .seoTitle(c.getSeoTitle())
                        .seoDescription(c.getSeoDescription())
                        .productCount(c.getProducts() != null ? c.getProducts().size() : 0)
                        .build())
                .collect(Collectors.toList());

        List<HomepageDataResponse.ColorSwatchDto> colors = getShopByColor();

        return HomepageDataResponse.builder()
                .sections(sectionResponses)
                .bestSellers(bestSellers)
                .trending(trending)
                .newArrivals(newArrivals)
                .limitedStock(limitedStock)
                .featured(featured)
                .collections(collectionResponses)
                .colors(colors)
                .build();
    }

    private void ensureDefaultSectionsExist() {
        if (homepageSectionRepository.count() > 0) return;

        log.info("Initializing default homepage merchandised sections");
        List<HomepageSection> defaults = List.of(
                HomepageSection.builder().sectionKey("HERO_BANNER").title("Royal Heritage").subtitle("Timeless Silks & Bridal Couture").displayOrder(1).active(true).automatic(true).maxItems(5).build(),
                HomepageSection.builder().sectionKey("SHOP_BY_COLLECTION").title("Curated Collections").subtitle("Handpicked weaves crafted for extraordinary moments").displayOrder(2).active(true).automatic(true).maxItems(6).build(),
                HomepageSection.builder().sectionKey("NEW_ARRIVALS").title("New Arrivals").subtitle("Freshly loomed sarees and seasonal collections").displayOrder(3).active(true).automatic(true).maxItems(8).build(),
                HomepageSection.builder().sectionKey("BEST_SELLERS").title("Bestselling Silks").subtitle("Our most cherished weaves celebrated across India").displayOrder(4).active(true).automatic(true).maxItems(8).build(),
                HomepageSection.builder().sectionKey("TRENDING_NOW").title("Trending Now").subtitle("Styles capturing the season's admiration").displayOrder(5).active(true).automatic(true).maxItems(8).build(),
                HomepageSection.builder().sectionKey("SHOP_BY_COLOR").title("Shop by Palette").subtitle("Explore sarees curated in pure pigments").displayOrder(6).active(true).automatic(true).maxItems(8).build(),
                HomepageSection.builder().sectionKey("LIMITED_STOCK").title("Limited Weaves").subtitle("Rare patterns with very few pieces remaining").displayOrder(7).active(true).automatic(true).maxItems(8).build(),
                HomepageSection.builder().sectionKey("BRAND_STORY").title("The AGVIA Legacy").subtitle("Master craftsmanship woven over generations").displayOrder(8).active(true).automatic(true).maxItems(1).build()
        );
        homepageSectionRepository.saveAll(defaults);
    }
}
