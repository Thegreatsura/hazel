import { Database, eq, schema } from "@hazel/db"
import type { OrganizationId, UserId } from "@hazel/schema"
import { Effect, Option } from "effect"
import { UserLookupCache } from "../cache/user-lookup-cache.ts"
import { SessionValidator } from "../session/session-validator.ts"
import type { AuthenticatedUserContext } from "../types.ts"

/**
 * Authentication error for proxy auth.
 * Simpler error type than backend since we don't need HTTP status codes.
 */
export class ProxyAuthenticationError extends Error {
	readonly _tag = "ProxyAuthenticationError"
	constructor(
		message: string,
		readonly detail?: string,
	) {
		super(message)
		this.name = "ProxyAuthenticationError"
	}
}

/**
 * Electric-proxy authentication service.
 * Provides fast session validation without user sync.
 *
 * Key differences from BackendAuth:
 * - Does NOT upsert users to database (validates only)
 * - Handles session refresh and returns new cookie if refreshed
 * - Rejects if user doesn't exist in database
 *
 * Note: Database.Database is intentionally NOT included in dependencies
 * as it's a global infrastructure layer provided at the application root.
 */
export class ProxyAuth extends Effect.Service<ProxyAuth>()("@hazel/auth/ProxyAuth", {
	accessors: true,
	dependencies: [SessionValidator.Default, UserLookupCache.Default],
	effect: Effect.gen(function* () {
		const validator = yield* SessionValidator
		const userLookupCache = yield* UserLookupCache
		const db = yield* Database.Database

		/**
		 * Lookup user by WorkOS ID, using cache first then database.
		 * Caches successful lookups for 5 minutes.
		 */
		const lookupUser = Effect.fn("ProxyAuth.lookupUser")(function* (workosUserId: string) {
			// Check cache first
			const cached = yield* userLookupCache.get(workosUserId).pipe(
				Effect.catchAll((error) => {
					// Log cache error but continue with database lookup
					return Effect.logWarning("User lookup cache error", error).pipe(
						Effect.map(() => Option.none<{ internalUserId: string }>()),
					)
				}),
			)

			if (Option.isSome(cached)) {
				yield* Effect.annotateCurrentSpan("cache.hit", true)
				return Option.some(cached.value.internalUserId)
			}

			// Cache miss - lookup in database
			const userOption = yield* db
				.execute((client) =>
					client
						.select({ id: schema.usersTable.id })
						.from(schema.usersTable)
						.where(eq(schema.usersTable.externalId, workosUserId))
						.limit(1),
				)
				.pipe(
					Effect.map((results) => Option.fromNullable(results[0])),
					Effect.mapError(
						(error) =>
							new ProxyAuthenticationError("Failed to lookup user in database", String(error)),
					),
				)

			// Cache successful lookup
			if (Option.isSome(userOption)) {
				yield* userLookupCache.set(workosUserId, userOption.value.id).pipe(
					Effect.catchAll((error) =>
						// Log cache error but don't fail the request
						Effect.logWarning("Failed to cache user lookup", error),
					),
				)
			}

			return Option.map(userOption, (user) => user.id)
		})

		/**
		 * Validate a session cookie and return user context.
		 * Uses cached session validation with automatic refresh.
		 * Rejects if user is not found in database.
		 * Returns refreshedSession if the session was refreshed (caller should set cookie).
		 */
		const validateSession = Effect.fn("ProxyAuth.validateSession")(function* (sessionCookie: string) {
			// Validate session with automatic refresh (uses Redis cache)
			const { session, newSealedSession } = yield* validator.validateAndRefresh(sessionCookie)

			// Lookup user (uses cache, falls back to database)
			const userIdOption = yield* lookupUser(session.workosUserId).pipe(
				Effect.withSpan("ProxyAuth.lookupUser", {
					attributes: { "workos.user_id": session.workosUserId },
				}),
			)

			if (Option.isNone(userIdOption)) {
				yield* Effect.annotateCurrentSpan("user.found", false)
				return yield* Effect.fail(
					new ProxyAuthenticationError(
						"User not found in database",
						`User must be created via backend first. WorkOS ID: ${session.workosUserId}`,
					),
				)
			}

			yield* Effect.annotateCurrentSpan("user.found", true)
			yield* Effect.annotateCurrentSpan("user.id", userIdOption.value)

			if (newSealedSession) {
				yield* Effect.annotateCurrentSpan("session.refreshed", true)
				yield* Effect.logDebug("Session was refreshed, returning new sealed session")
			}

			return {
				workosUserId: session.workosUserId,
				internalUserId: userIdOption.value as UserId,
				email: session.email,
				organizationId: session.internalOrganizationId as OrganizationId | undefined,
				role: session.role ?? undefined,
				refreshedSession: newSealedSession,
			} satisfies AuthenticatedUserContext
		})

		return {
			validateSession,
		}
	}),
}) {}

/**
 * Layer that provides ProxyAuth with all its dependencies via Effect.Service dependencies.
 *
 * ProxyAuth.Default automatically includes:
 * - SessionValidator.Default (which includes WorkOSClient.Default + SessionCache.Default)
 *
 * External dependencies that must be provided:
 * - Redis (for SessionCache)
 * - Database.Database (for user lookup)
 */
export const ProxyAuthLive = ProxyAuth.Default
