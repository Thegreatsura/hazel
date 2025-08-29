import * as PgDrizzle from "@effect/sql-drizzle/Pg"
import { PgClient } from "@effect/sql-pg"
import { Config, Layer } from "effect"

const SqlLive = PgClient.layerConfig({
	url: Config.redacted("DATABASE_URL"),
})

const DrizzleLive = PgDrizzle.layerWithConfig({}).pipe(Layer.provide(SqlLive))

export const DatabaseLive = Layer.mergeAll(SqlLive, DrizzleLive)
