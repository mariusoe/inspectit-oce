package rocks.inspectit.ocelot.core.exporter;

import com.github.tomakehurst.wiremock.WireMockServer;
import io.opencensus.exporter.trace.zipkin.ZipkinTraceExporter;
import io.opencensus.trace.Tracing;
import io.opencensus.trace.samplers.Samplers;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import rocks.inspectit.ocelot.core.SpringTestBase;

import java.util.concurrent.TimeUnit;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.awaitility.Awaitility.await;

@TestPropertySource(properties = {
        "inspectit.exporters.tracing.zipkin.url=http://127.0.0.1:9411/api/v2/spans"
})
@DirtiesContext
@Slf4j
public class ZipkinExporterServiceIntTest extends SpringTestBase {

    public static final int ZIPKIN_PORT = 9411;
    public static final String ZIPKIN_PATH = "/api/v2/spans";
    private WireMockServer wireMockServer;

    @BeforeEach
    void setupWiremock() {
        wireMockServer = new WireMockServer(options().port(ZIPKIN_PORT));
        wireMockServer.start();
        configureFor(wireMockServer.port());
        stubFor(get(urlPathEqualTo(ZIPKIN_PATH))
                .willReturn(aResponse()
                        .withStatus(200)));

    }

    @AfterEach
    void cleanup() {
        wireMockServer.stop();
    }

    @Test
    void verifyTraceSent() throws InterruptedException {
        Tracing.getTracer().spanBuilder("zipkinspan")
                .setSampler(Samplers.alwaysSample())
                .startSpanAndRun(() -> {
                });

        // Shutdown the export component to force a flush. This will cause problems if multiple tests
        // are added in this class, but this is not the case for the moment.
        Tracing.getExportComponent().shutdown();
        ZipkinTraceExporter.unregister();

        log.info("Wait for Zipkin to process the span...");
        long timeWaitingForSpansToBeExportedInMillis = 1100L;
        Thread.sleep(timeWaitingForSpansToBeExportedInMillis);

        await().atMost(15, TimeUnit.SECONDS).pollDelay(1, TimeUnit.SECONDS).untilAsserted(() -> {
            verify(postRequestedFor(urlPathEqualTo(ZIPKIN_PATH)).withRequestBody(containing("zipkinspan")));
        });
    }

}
