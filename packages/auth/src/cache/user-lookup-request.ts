import { UserId, WorkOSUserId } from "@hazel/schema"
import { PrimaryKey, Schema } from "effect"
import { UserLookupCacheError } from "../errors.ts"

/**
 * Schema for cached user lookup result.
 * Maps workosUserId to internalUserId.
 */
export const UserLookupResult = Schema.Struct({
	internalUserId: UserId,
})

export type UserLookupResult = typeof UserLookupResult.Type

/**
 * Request type for user lookup cache operations.
 * Implements TaggedRequest for use with @effect/experimental Persistence.
 */
export class UserLookupCacheRequest extends Schema.TaggedRequest<UserLookupCacheRequest>()(
	"UserLookupCacheRequest",
	{
		failure: UserLookupCacheError,
		success: UserLookupResult,
		payload: {
			/** WorkOS user ID (external ID) */
			workosUserId: WorkOSUserId,
		},
	},
) {
	/**
	 * Primary key for cache storage.
	 * Used by ResultPersistence to generate the cache key.
	 */
	[PrimaryKey.symbol]() {
		return this.workosUserId
	}
}
