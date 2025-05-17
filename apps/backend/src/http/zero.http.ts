import postgres from "postgres"

import { PostgresJSConnection, PushProcessor, ZQLDatabase } from "@rocicorp/zero/pg"

import { HttpApiBuilder, HttpServerRequest } from "@effect/platform"
import { MakiApi } from "@maki-chat/api-schema"
import { CurrentUser } from "@maki-chat/api-schema/schema/user.js"
import { createMutators, schema } from "@maki-chat/zero"
import { Config, Effect } from "effect"
import { serverMutators } from "../server-mutators"

export const ZeroApiLive = HttpApiBuilder.group(MakiApi, "Zero", (handlers) =>
	Effect.gen(function* () {
		const databaseUrl = yield* Config.string("DATABASE_URL")

		return handlers.handle(
			"push",
			Effect.fnUntraced(function* () {
				const req = yield* HttpServerRequest.HttpServerRequest

				const currentUser = yield* CurrentUser

				const raw = req.source as Request

				const processor = new PushProcessor(
					new ZQLDatabase(new PostgresJSConnection(postgres(databaseUrl)), schema),
				)

				const result = yield* Effect.promise(() => processor.process(serverMutators(createMutators()), raw))
				return result
			}),
		)
	}),
)
