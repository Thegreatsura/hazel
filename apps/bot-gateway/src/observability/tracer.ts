import { createTracingLayer } from "@hazel/effect-bun/Telemetry"

/**
 * OpenTelemetry tracing layer for bot-gateway.
 *
 * Uses Effect DevTools in local environment, OTLP in production.
 */
export const TracerLive = createTracingLayer("bot-gateway")
