package com.ems.pragathisweets.security;

import com.ems.pragathisweets.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String password;
    private final String phone;
    private final boolean phoneVerified;
    private final boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String fullName, String email, String phone, String password,
                            boolean enabled, boolean phoneVerified, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.enabled = enabled;
        this.phoneVerified = phoneVerified;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        com.ems.pragathisweets.entity.Role role = user.getRole() != null ? user.getRole() : com.ems.pragathisweets.entity.Role.ROLE_USER;
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role.name()));
        return new UserDetailsImpl(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getPassword(),
                user.isEnabled(),
                user.isPhoneVerified(),
                authorities
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isPhoneVerified() {
        return phoneVerified;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
