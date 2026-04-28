import { assert } from "chai"
import sinon from "sinon"

describe("openTelemetry side-effect startup", function() {
    this.timeout(10000)
    const OLD_ENV = process.env
    const configPath = "open-telemetry/openTelemetry.config"
    const otelPath = "openTelemetry"

    beforeEach(() => {
        process.env = { ...OLD_ENV }
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4317"
        delete require.cache[require.resolve(configPath)]
        delete require.cache[require.resolve(otelPath)]
    })

    afterEach(() => {
        process.env = OLD_ENV
        delete require.cache[require.resolve(configPath)]
        delete require.cache[require.resolve(otelPath)]
    })

    it("logs disabled message and does not throw if otelLogEnabled is false", () => {
        process.env.OTEL_LOG_ENABLED = "false"
        const infoStub = sinon.stub(console, "info")
        // Should not throw
        require(otelPath)
        assert(infoStub.calledWith("OpenTelemetry is disabled."))
        infoStub.restore()
    })

    it("starts OpenTelemetry if otelLogEnabled is true", () => {
        process.env.OTEL_LOG_ENABLED = "true"
        const infoStub = sinon.stub(console, "info")
        // Should not throw
        require(otelPath)
        assert(infoStub.calledWith("OpenTelemetry started successfully."))
        infoStub.restore()
    })

    it("throws an exception if OTEL_EXPORTER_OTLP_ENDPOINT is not set", () => {
        delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        assert.throws(() => require(otelPath), /OTEL_EXPORTER_OTLP_ENDPOINT is not set/)
    })
})
