import { describe, expect, it } from "vitest"
import { ACTOR_SERVICE_ERROR_UI_MESSAGE } from "@hazel/domain"
import { normalizeMessageActorError } from "./use-message-actor"

describe("normalizeMessageActorError", () => {
	it("normalizes cached and live actor auth failures into a service error", () => {
		expect(normalizeMessageActorError("Invalid bot token: Not Found")).toBe(
			ACTOR_SERVICE_ERROR_UI_MESSAGE,
		)
		expect(normalizeMessageActorError(new Error("Authentication service unavailable"))).toBe(
			ACTOR_SERVICE_ERROR_UI_MESSAGE,
		)
	})

	it("preserves non-service actor errors", () => {
		expect(normalizeMessageActorError("Tool execution failed")).toBe("Tool execution failed")
	})

	it("falls back to a generic connection error for unknown values", () => {
		expect(normalizeMessageActorError({})).toBe("Connection failed. Please try again.")
	})
})
