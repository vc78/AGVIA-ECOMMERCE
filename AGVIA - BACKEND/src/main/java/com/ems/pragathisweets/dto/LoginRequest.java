package com.ems.pragathisweets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /** Accepts user's email address OR mobile number (+91XXXXXXXXXX or 10-digit Indian number) */
    private String email;

    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;

    private Boolean rememberMe;

    public String getEffectiveIdentifier() {
        if (identifier != null && !identifier.isBlank()) {
            return identifier.trim();
        }
        return email != null ? email.trim() : "";
    }
}
