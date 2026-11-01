package com.mememto.auth;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OneTimeTokenRepository extends JpaRepository<OneTimeToken, String> {
    void deleteByUserIdAndPurpose(UUID userId, TokenPurpose purpose);

    void deleteByUserId(UUID userId);
}
