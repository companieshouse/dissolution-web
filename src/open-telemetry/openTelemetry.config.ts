interface OpenTelemetryConfiguration {
    env: string;
    applicationNamespace: string;
    baseUrl: string;
    otel: {
        otelLogEnabled: boolean;
        traceExporterUrl: string;
        metricsExporterUrl: string;
    };
}

const env : NodeJS.ProcessEnv = process.env
const otlpEndpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT
if (!otlpEndpoint) {
    throw new Error("OTEL_EXPORTER_OTLP_ENDPOINT is not set")
}

const openTelemetryConfig: OpenTelemetryConfiguration = {
    env: (env.NODE_ENV || "development").toLowerCase(),
    applicationNamespace: env.OTEL_SERVICE_NAME ?? "undefined-service",
    baseUrl: env.CHS_URL ?? "",
    otel: {
        traceExporterUrl: `${otlpEndpoint}/v1/traces`,
        metricsExporterUrl: `${otlpEndpoint}/v1/metrics`,
        otelLogEnabled: env.OTEL_LOG_ENABLED === "true"
    }
}

export default openTelemetryConfig
