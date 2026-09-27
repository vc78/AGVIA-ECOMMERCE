package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.admin.AiProductGenerateRequest;
import com.ems.pragathisweets.dto.admin.AiProductGenerateResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiProductGenerateResponse generateProductContent(AiProductGenerateRequest request) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                return callGeminiApi(request);
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to local boutique template generator: {}", e.getMessage());
            }
        }
        return generateArtisanalFallback(request);
    }

    private AiProductGenerateResponse callGeminiApi(AiProductGenerateRequest request) throws Exception {
        String endpoint = apiUrl + "?key=" + apiKey.trim();

        String prompt = String.format(
                "You are an expert luxury Indian confectioner and copywriter for Pragathi Sweets. " +
                "Generate a JSON response for a product with the following details:\n" +
                "Name: %s\nCategory: %s\nIngredients: %s\nWeight: %s\nPrice: %s\nKey characteristics: %s\n\n" +
                "Respond ONLY with valid JSON having the exact keys: description, shortDescription, suggestedCategory, tags (array of strings), highlights (array of strings), seoDescription. " +
                "Do not include markdown backticks or explanations.",
                request.getName(),
                request.getCategory() != null ? request.getCategory() : "",
                request.getIngredients() != null ? request.getIngredients() : "",
                request.getWeight() != null ? request.getWeight() : "",
                request.getPrice() != null ? request.getPrice() : "",
                request.getCharacteristics() != null ? request.getCharacteristics() : ""
        );

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> payload = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                String cleaned = text.trim();
                if (cleaned.startsWith("```json")) {
                    cleaned = cleaned.substring(7);
                } else if (cleaned.startsWith("```")) {
                    cleaned = cleaned.substring(3);
                }
                if (cleaned.endsWith("```")) {
                    cleaned = cleaned.substring(0, cleaned.length() - 3);
                }
                cleaned = cleaned.trim();

                JsonNode parsed = objectMapper.readTree(cleaned);
                List<String> tags = new ArrayList<>();
                if (parsed.has("tags") && parsed.get("tags").isArray()) {
                    parsed.get("tags").forEach(t -> tags.add(t.asText()));
                }
                List<String> highlights = new ArrayList<>();
                if (parsed.has("highlights") && parsed.get("highlights").isArray()) {
                    parsed.get("highlights").forEach(h -> highlights.add(h.asText()));
                }

                return AiProductGenerateResponse.builder()
                        .name(request.getName())
                        .description(parsed.path("description").asText())
                        .shortDescription(parsed.path("shortDescription").asText())
                        .suggestedCategory(parsed.path("suggestedCategory").asText(request.getCategory()))
                        .tags(tags)
                        .highlights(highlights)
                        .seoDescription(parsed.path("seoDescription").asText())
                        .build();
            }
        }
        return generateArtisanalFallback(request);
    }

    private AiProductGenerateResponse generateArtisanalFallback(AiProductGenerateRequest request) {
        String name = request.getName() != null && !request.getName().isBlank() ? request.getName() : "Royal Confection";
        String cat = request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory() : "Boutique Sweets";
        String desc = String.format("Handcrafted %s prepared according to royal heritage recipes with pure A2 Desi Ghee, cardamom, and fresh natural ingredients. A beloved centerpiece for celebrations.", name);
        String shortDesc = String.format("Artisanal %s made with 100%% pure ghee and authentic heritage craftsmanship.", name);
        String seo = String.format("Buy fresh %s online from Pragathi Sweets. Made with pure desi ghee and premium dry fruits. Fast dispatch guaranteed.", name);

        return AiProductGenerateResponse.builder()
                .name(name)
                .description(desc)
                .shortDescription(shortDesc)
                .suggestedCategory(cat)
                .tags(List.of("Pure Desi Ghee", "Artisanal", "Boutique", "Fresh Batch", "Traditional"))
                .highlights(List.of("100% Pure Cow Ghee", "Zero Artificial Preservatives", "Same-day fresh preparation", "Royal Gift Packaging"))
                .seoDescription(seo)
                .build();
    }
}
