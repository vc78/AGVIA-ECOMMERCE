package com.ems.pragathisweets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Lokesh Lingam Weaver e-commerce backend.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class PragathiSweetsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PragathiSweetsApplication.class, args);
    }
}
