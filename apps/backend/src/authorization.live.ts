import { Authorization } from "@maki-chat/api-schema/authorization.js"
import { User, UserId } from "@maki-chat/api-schema/schema/user.js"

import { Unauthorized } from "@maki-chat/api-schema/errors.js"
import { Effect, Layer, Redacted } from "effect"
import { JWT, JWT_REMOTE_PUBLIC_KEY, Jose } from "./services/jose"

export const AuthorizationLive = Layer.effect(
	Authorization,
	Effect.gen(function* () {
		const jose = yield* Jose

		return Authorization.of({
			bearer: Effect.fn("Authorization.bearer")(function* (bearerToken) {
				const res = yield* jose
					.jwtVerifyRemote(
						JWT_REMOTE_PUBLIC_KEY.make(
							"https://modest-scorpion-78.clerk.accounts.dev/.well-known/jwks.json",
						),
						JWT.make(Redacted.value(bearerToken)),
					)
					.pipe(
						Effect.catchTags({
							JoseError: (e) =>
								new Unauthorized({
									actorId: UserId.make("demo"),
									entity: "authorization",
									action: "bearer",
								}),
						}),
					)

				return User.make({
					userId: UserId.make(res.payload.sub!),
				})
			}),
		})
	}),
)
