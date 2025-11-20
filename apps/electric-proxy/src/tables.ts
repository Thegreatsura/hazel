import { Effect, Match, Schema } from "effect"
import type { AuthenticatedUser } from "./auth"

/**
 * Error thrown when table access is denied or where clause cannot be generated
 */
export class TableAccessError extends Schema.TaggedError<TableAccessError>()("TableAccessError", {
	message: Schema.String,
	detail: Schema.optional(Schema.String),
	table: Schema.String,
}) {}

/**
 * Whitelisted tables that can be accessed through the Electric proxy.
 * Only these tables are allowed for authenticated users.
 */
export const ALLOWED_TABLES = [
	// User tables
	"users",
	"user_presence_status",

	// Organization tables
	"organizations",
	"organization_members",

	// Channel tables
	"channels",
	"channel_members",

	// Message tables
	"messages",
	"message_reactions",
	"attachments",

	// Notification tables
	"notifications",
	"pinned_messages",

	// Interaction tables
	"typing_indicators",
	"invitations",

	// Bot tables
	"bots",
] as const

export type AllowedTable = (typeof ALLOWED_TABLES)[number]

/**
 * Check if a table name is allowed
 */
export function isTableAllowed(table: string): table is AllowedTable {
	return ALLOWED_TABLES.includes(table as AllowedTable)
}

/**
 * Validate that a table parameter is present and allowed
 */
export function validateTable(table: string | null): {
	valid: boolean
	table?: AllowedTable
	error?: string
} {
	if (!table) {
		return {
			valid: false,
			error: "Missing required parameter: table",
		}
	}

	if (!isTableAllowed(table)) {
		return {
			valid: false,
			error: `Table '${table}' is not allowed. Only whitelisted tables can be accessed.`,
		}
	}

	return {
		valid: true,
		table: table as AllowedTable,
	}
}

/**
 * Get the WHERE clause for a table based on the authenticated user.
 * This ensures users can only access data they have permission to see.
 *
 * @param table - The table name
 * @param user - The authenticated user context
 * @returns Effect that succeeds with SQL WHERE clause string or fails with TableAccessError
 */
export function getWhereClauseForTable(
	table: AllowedTable,
	user: AuthenticatedUser,
): Effect.Effect<string, TableAccessError> {
	return Match.value(table).pipe(
		Match.when("users", () =>
			Effect.succeed(
				`"id" IN (SELECT "userId" FROM "organization_members" WHERE "organizationId" IN (SELECT "organizationId" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("user_presence_status", () =>
			Effect.succeed(
				`"userId" IN (SELECT "userId" FROM "organization_members" WHERE "organizationId" IN (SELECT "organizationId" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL)`,
			),
		),
		Match.when("organizations", () =>
			Effect.succeed(
				`"id" IN (SELECT "organizationId" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("organization_members", () =>
			Effect.succeed(
				`"organizationId" IN (SELECT "organizationId" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("channels", () =>
			Effect.succeed(
				`"id" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("channel_members", () =>
			Effect.succeed(
				`"channelId" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("messages", () =>
			Effect.succeed(
				`"channelId" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("message_reactions", () =>
			Effect.succeed(
				`"messageId" IN (SELECT "id" FROM "messages" WHERE "channelId" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL)`,
			),
		),
		Match.when("attachments", () =>
			Effect.succeed(
				`"channelId" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL`,
			),
		),
		Match.when("notifications", () =>
			Effect.succeed(
				`"memberId" IN (SELECT "id" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL)`,
			),
		),
		Match.when("pinned_messages", () =>
			Effect.succeed(
				`"channelId" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL)`,
			),
		),
		Match.when("typing_indicators", () =>
			Effect.succeed(
				`"channelId" IN (SELECT "channelId" FROM "channel_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL)`,
			),
		),
		Match.when("invitations", () =>
			Effect.succeed(
				`"organizationId" IN (SELECT "organizationId" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL)`,
			),
		),
		Match.when("bots", () =>
			Effect.succeed(
				`("isPublic" = true OR "createdBy" = '${user.internalUserId}' OR "userId" IN (SELECT "userId" FROM "organization_members" WHERE "organizationId" IN (SELECT "organizationId" FROM "organization_members" WHERE "userId" = '${user.internalUserId}' AND "deletedAt" IS NULL) AND "deletedAt" IS NULL)) AND "deletedAt" IS NULL`,
			),
		),
		Match.orElse((table) =>
			Effect.fail(
				new TableAccessError({
					message: "Table not handled in where clause system",
					detail: `Missing where clause implementation for table: ${table}`,
					table,
				}),
			),
		),
	)
}
