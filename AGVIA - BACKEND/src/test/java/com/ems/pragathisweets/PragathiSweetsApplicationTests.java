package com.ems.pragathisweets;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import javax.sql.DataSource;

@SpringBootTest(properties = {
    "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
    "spring.jpa.hibernate.ddl-auto=none"
})
class PragathiSweetsApplicationTests {

    @MockBean
    private DataSource dataSource;

    @MockBean
    private com.ems.pragathisweets.config.DataInitializer dataInitializer;

    @Test
    void contextLoads() {
    }
}
