import { assert } from "chai"

describe("openTelemetryConfig integration", () => {
    const OLD_ENV = process.env
    const openTelemetryConfig = "../../src/open-telemetry/openTelemetry.config"

    beforeEach(() => {
        process.env = { ...OLD_ENV }
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4317"
        delete require.cache[require.resolve(openTelemetryConfig)]
    })

    afterEach(() => {
        process.env = OLD_ENV
        delete require.cache[require.resolve(openTelemetryConfig)]
    })

    it("returns correct config when all required env vars are set", () => {
        process.env.OTEL_SERVICE_NAME = "dissolution-web"
        process.env.OTEL_LOG_ENABLED = "true"
        const config = require(openTelemetryConfig).default
        assert.equal(config.serviceName, "dissolution-web")
        assert.equal(config.endpoints.traceExporterUrl, "http://localhost:4317/v1/traces")
        assert.equal(config.endpoints.metricsExporterUrl, "http://localhost:4317/v1/metrics")
        assert.isTrue(config.enabled)
    })

    it("throws an error if OTEL_EXPORTER_OTLP_ENDPOINT is not set", () => {
        delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        process.env.OTEL_LOG_ENABLED = "true"
        assert.throws(() => require(openTelemetryConfig), /OTEL_EXPORTER_OTLP_ENDPOINT is not set/)
    })

    it("defaults serviceName to undefined-service when OTEL_SERVICE_NAME is undefined", () => {
        delete process.env.NODE_ENV
        delete process.env.OTEL_SERVICE_NAME
        const config = require(openTelemetryConfig).default
        assert.equal(config.serviceName, "undefined-service")
    })

    it("sets enabled to false if OTEL_LOG_ENABLED is not 'true'", () => {
        process.env.OTEL_LOG_ENABLED = "false"
        const config = require(openTelemetryConfig).default
        assert.isFalse(config.enabled)
    })

})

