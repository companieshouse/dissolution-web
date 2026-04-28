import { assert } from "chai"

describe("openTelemetryConfig integration", () => {
    const OLD_ENV = process.env
    const configPath = "../../src/open-telemetry/openTelemetry.config"

    beforeEach(() => {
        process.env = { ...OLD_ENV }
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4317"
        delete require.cache[require.resolve(configPath)]
    })

    afterEach(() => {
        process.env = OLD_ENV
        delete require.cache[require.resolve(configPath)]
    })

    it("returns correct config when all required env vars are set", () => {
        process.env.NODE_ENV = "production"
        process.env.OTEL_SERVICE_NAME = "dissolution-web"
        process.env.CHS_URL = "http://chs.local"
        process.env.OTEL_LOG_ENABLED = "true"
        const config = require(configPath).default
        assert.equal(config.env, "production")
        assert.equal(config.applicationNamespace, "dissolution-web")
        assert.equal(config.baseUrl, "http://chs.local")
        assert.equal(config.otel.traceExporterUrl, "http://localhost:4317/v1/traces")
        assert.equal(config.otel.metricsExporterUrl, "http://localhost:4317/v1/metrics")
        assert.isTrue(config.otel.otelLogEnabled)
    })

    it("throws an error if OTEL_EXPORTER_OTLP_ENDPOINT is not set", () => {
        delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        assert.throws(() => require(configPath), /OTEL_EXPORTER_OTLP_ENDPOINT is not set/)
    })

    it("defaults NODE_ENV to development and OTEL_SERVICE_NAME to undefined-service", () => {
        delete process.env.NODE_ENV
        delete process.env.OTEL_SERVICE_NAME
        const config = require(configPath).default
        assert.equal(config.env, "development")
        assert.equal(config.applicationNamespace, "undefined-service")
    })

    it("sets otelLogEnabled to false if OTEL_LOG_ENABLED is not 'true'", () => {
        process.env.OTEL_LOG_ENABLED = "false"
        const config = require(configPath).default
        assert.isFalse(config.otel.otelLogEnabled)
    })

    it("sets baseUrl to empty string if CHS_URL is not set", () => {
        delete process.env.CHS_URL
        const config = require(configPath).default
        assert.equal(config.baseUrl, "")
    })
})

