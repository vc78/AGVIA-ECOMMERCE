package com.ems.pragathisweets.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrafficSourceItem {
    private String source;
    private long count;
    private double percentage;
}
