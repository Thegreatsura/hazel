import { UserId } from "@hazel/db/schema"
import { randomUUIDv7 } from "bun"
import { Effect, Layer, Redacted } from "effect"
import { Authorization, User } from "../lib/auth"

export const AuthorizationLive = Layer.effect(
	Authorization,
	Effect.gen(function* () {
		yield* Effect.log("creating Authorization middleware")

		return {
			bearer: (bearerToken) =>
				Effect.gen(function* () {
					yield* Effect.log("checking bearer token", Redacted.value(bearerToken))
					return new User({ id: UserId.make(randomUUIDv7()) })
				}),
		}
	}),
)
