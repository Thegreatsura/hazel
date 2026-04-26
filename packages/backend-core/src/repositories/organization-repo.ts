import { and, Database, eq, isNull, Repository, schema, sql, type TxFn } from "@hazel/db"
import type { OrganizationId, UserId } from "@hazel/schema"
import { Organization } from "@hazel/domain/models"
import { Context, Effect, Layer, Option, type Schema } from "effect"
import { ChannelMemberRepo } from "./channel-member-repo"
import { ChannelRepo } from "./channel-repo"

export class OrganizationRepo extends Context.Service<OrganizationRepo>()("OrganizationRepo", {
	make: Effect.gen(function* () {
		const baseRepo = yield* Repository.makeRepository(
			schema.organizationsTable,
			{ insert: Organization.Insert, update: Organization.Update },
			{
				idColumn: "id",
				name: "Organization",
			},
		)
		const db = yield* Database.Database
		const channelRepo = yield* ChannelRepo
		const channelMemberRepo = yield* ChannelMemberRepo

		const findBySlug = (slug: string, tx?: TxFn) =>
			db
				.makeQuery((execute, slugValue: string) =>
					execute((client) =>
						client
							.select()
							.from(schema.organizationsTable)
							.where(eq(schema.organizationsTable.slug, slugValue))
							.limit(1),
					),
				)(slug, tx)
				.pipe(Effect.map((results) => Option.fromNullishOr(results[0])))

		// Find an organization by the Clerk org id stashed in `settings.clerkOrganizationId`.
		// Used by the Clerk webhook so post-migration events resolve to the canonical row
		// even when slugs diverge between WorkOS-era and Clerk.
		const findByClerkOrgId = (clerkOrgId: string, tx?: TxFn) =>
			db
				.makeQuery((execute, payload: { clerkOrgId: string }) =>
					execute((client) =>
						client
							.select()
							.from(schema.organizationsTable)
							.where(
								and(
									sql`${schema.organizationsTable.settings}->>'clerkOrganizationId' = ${payload.clerkOrgId}`,
									isNull(schema.organizationsTable.deletedAt),
								),
							)
							.limit(1),
					),
				)({ clerkOrgId }, tx)
				.pipe(Effect.map((results) => Option.fromNullishOr(results[0])))

		// Resolve a Clerk organization to a local row, creating or back-linking as needed.
		// Lookup order is Clerk-ID first, slug second — this is the same order the Clerk
		// webhook uses, and it must stay aligned to prevent duplicate "ghost" rows from
		// being recreated by the session lazy-sync after a dedup pass.
		const upsertFromClerk = (
			clerk: { id: string; name: string; slug: string | null; imageUrl?: string | null },
			tx?: TxFn,
		) =>
			Effect.gen(function* () {
				const byClerkId = yield* findByClerkOrgId(clerk.id, tx).pipe(Effect.map(Option.getOrNull))
				const bySlug =
					!byClerkId && clerk.slug
						? yield* findBySlug(clerk.slug, tx).pipe(Effect.map(Option.getOrNull))
						: null
				const existing = byClerkId ?? bySlug

				if (existing) {
					const currentSettings =
						(existing.settings as { clerkOrganizationId?: string } | null) ?? null
					const needsClerkIdLink = currentSettings?.clerkOrganizationId !== clerk.id
					const desiredLogoUrl = clerk.imageUrl ?? existing.logoUrl
					const needsLogoUpdate = desiredLogoUrl !== existing.logoUrl
					const needsNameUpdate = clerk.name !== existing.name

					if (needsClerkIdLink || needsLogoUpdate || needsNameUpdate) {
						yield* baseRepo.update(
							{
								id: existing.id,
								...(needsNameUpdate ? { name: clerk.name } : {}),
								...(needsLogoUpdate ? { logoUrl: desiredLogoUrl } : {}),
								...(needsClerkIdLink
									? {
											settings: {
												...(currentSettings ?? {}),
												clerkOrganizationId: clerk.id,
											},
										}
									: {}),
							},
							tx,
						)
					}
					return existing
				}

				if (!clerk.slug) return null

				const inserted = yield* baseRepo
					.insert(
						{
							name: clerk.name,
							slug: clerk.slug,
							logoUrl: clerk.imageUrl ?? null,
							isPublic: false,
							settings: { clerkOrganizationId: clerk.id },
							deletedAt: null,
						},
						tx,
					)
					.pipe(Effect.map((rows) => rows[0]!))
				return inserted
			})

		const findBySlugIfPublic = (slug: string, tx?: TxFn) =>
			db
				.makeQuery((execute, slugValue: string) =>
					execute((client) =>
						client
							.select()
							.from(schema.organizationsTable)
							.where(
								and(
									eq(schema.organizationsTable.slug, slugValue),
									eq(schema.organizationsTable.isPublic, true),
									isNull(schema.organizationsTable.deletedAt),
								),
							)
							.limit(1),
					),
				)(slug, tx)
				.pipe(Effect.map((results) => Option.fromNullishOr(results[0])))

		const findAllActive = (tx?: TxFn) =>
			db.makeQuery((execute, _data: {}) =>
				execute((client) =>
					client
						.select()
						.from(schema.organizationsTable)
						.where(isNull(schema.organizationsTable.deletedAt)),
				),
			)({}, tx)

		const softDelete = (id: OrganizationId, tx?: TxFn) =>
			db.makeQuery((execute, orgId: OrganizationId) =>
				execute((client) =>
					client
						.update(schema.organizationsTable)
						.set({ deletedAt: new Date() })
						.where(
							and(
								eq(schema.organizationsTable.id, orgId),
								isNull(schema.organizationsTable.deletedAt),
							),
						),
				),
			)(id, tx)

		const setupDefaultChannels = (organizationId: OrganizationId, userId: UserId) =>
			Effect.gen(function* () {
				// Create default "general" channel
				const defaultChannel = yield* channelRepo
					.insert({
						name: "general",
						icon: null,
						type: "public",
						organizationId,
						parentChannelId: null,
						sectionId: null,
						deletedAt: null,
					})
					.pipe(Effect.map((res) => res[0]!))

				// Add creator as channel member
				yield* channelMemberRepo.insert({
					channelId: defaultChannel.id,
					userId,
					isHidden: false,
					isMuted: false,
					isFavorite: false,
					lastSeenMessageId: null,
					notificationCount: 0,
					joinedAt: new Date(),
					deletedAt: null,
				})

				return defaultChannel
			})

		return {
			...baseRepo,
			findBySlug,
			findByClerkOrgId,
			findBySlugIfPublic,
			findAllActive,
			softDelete,
			setupDefaultChannels,
			upsertFromClerk,
		}
	}),
}) {
	static readonly layer = Layer.effect(this, this.make).pipe(
		Layer.provide(ChannelRepo.layer),
		Layer.provide(ChannelMemberRepo.layer),
	)
}
