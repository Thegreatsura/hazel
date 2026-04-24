/**
 * Find orgs that appear to be duplicated after the Clerk migration.
 * Groups active orgs by lowercased name. For each group with >1 row,
 * prints slug, logoUrl, clerkOrganizationId (from settings), member count,
 * channel count, and createdAt so we can see the canonical row vs. the ghost.
 */

import { Database, and, eq, isNull, sql, schema } from "@hazel/db"
import { Effect, Logger } from "effect"
import { DatabaseLive } from "../../services/database"

const program = Effect.gen(function* () {
	const db = yield* Database.Database

	const orgs = yield* db.makeQuery((execute, _data: {}) =>
		execute((client) =>
			client
				.select({
					id: schema.organizationsTable.id,
					name: schema.organizationsTable.name,
					slug: schema.organizationsTable.slug,
					logoUrl: schema.organizationsTable.logoUrl,
					settings: schema.organizationsTable.settings,
					createdAt: schema.organizationsTable.createdAt,
				})
				.from(schema.organizationsTable)
				.where(isNull(schema.organizationsTable.deletedAt)),
		),
	)({})

	yield* Effect.log(`Total active orgs: ${orgs.length}`)

	const byName = new Map<string, typeof orgs>()
	for (const o of orgs) {
		const key = o.name.trim().toLowerCase()
		const list = byName.get(key) ?? []
		list.push(o)
		byName.set(key, list)
	}

	const dupes = [...byName.entries()].filter(([_, list]) => list.length > 1)
	yield* Effect.log(`Name groups with >1 row: ${dupes.length}`)

	for (const [name, list] of dupes) {
		yield* Effect.log(`\n=== "${name}" — ${list.length} rows ===`)
		for (const o of list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
			const memberCount = yield* db.makeQuery(
				(execute, payload: { orgId: string }) =>
					execute(
						(client) =>
							client.execute(sql`
								select count(*)::int as n
								from organization_members
								where "organizationId" = ${payload.orgId} and "deletedAt" is null
							`) as unknown as Promise<Array<{ n: number }>>,
					),
			)({ orgId: o.id })

			const channelCount = yield* db.makeQuery(
				(execute, payload: { orgId: string }) =>
					execute(
						(client) =>
							client.execute(sql`
								select count(*)::int as n
								from channels
								where "organizationId" = ${payload.orgId} and "deletedAt" is null
							`) as unknown as Promise<Array<{ n: number }>>,
					),
			)({ orgId: o.id })

			const messageCount = yield* db.makeQuery(
				(execute, payload: { orgId: string }) =>
					execute(
						(client) =>
							client.execute(sql`
								select count(*)::int as n
								from messages m
								join channels c on c.id = m."channelId"
								where c."organizationId" = ${payload.orgId}
							`) as unknown as Promise<Array<{ n: number }>>,
					),
			)({ orgId: o.id })

			const clerkOrgId = (o.settings as any)?.clerkOrganizationId ?? "(none)"
			yield* Effect.log(
				`  id=${o.id}  slug=${o.slug}  logoUrl=${o.logoUrl ? "set" : "null"}  clerkOrgId=${clerkOrgId}  members=${memberCount[0]!.n}  channels=${channelCount[0]!.n}  messages=${messageCount[0]!.n}  created=${o.createdAt.toISOString()}`,
			)
		}
	}
}).pipe(Effect.provide(DatabaseLive), Effect.provide(Logger.layer([Logger.consolePretty()])))

Effect.runPromise(program as Effect.Effect<void>)
