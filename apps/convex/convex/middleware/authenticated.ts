import type { Doc } from "convex-hazel/_generated/dataModel"
import type { QueryCtx } from "convex-hazel/_generated/server"

export const withUser = <Ctx extends QueryCtx, Args extends [any] | [], Output>(
	func: (ctx: Ctx & { user: Doc<"users"> }, ...args: Args) => Promise<Output>,
): ((ctx: Ctx, ...args: Args) => Promise<Output>) => {
	return async (ctx: Ctx, ...args: Args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Unauthenticated call to function requiring authentication")
		}

		const user = await ctx.db
			.query("users")
			.withIndex("bg_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique()
		if (!user) throw new Error("User not found")
		return func({ ...ctx, user }, ...args)
	}
}

// export const authenticated = <
// 	TContext extends GenericQueryCtx<any> | GenericMutationCtx<any>,
// 	TArgs extends PropertyValidators | Validator<any, "required", any> | void,
// 	TResult,
// 	TOneOrZeroArgs extends ArgsArrayForOptionalValidator<TArgs> = DefaultArgsForOptionalValidator<TArgs>,
// >({
// 	args,
// 	handler,
// }: {
// 	args: TArgs
// 	handler: ({ ctx, identity }: { ctx: TContext; identity: UserIdentity }, ...args: TOneOrZeroArgs) => Promise<TResult>
// }) => {
// 	return async (ctx: TContext, ...args: TOneOrZeroArgs): Promise<TResult> => {
// 		const identity = await ctx.auth.getUserIdentity()
// 		if (identity === null) {
// 			throw new Error("Not authenticated")
// 		}

// 		return await handler({ ctx, identity }, ...args)
// 	}
// }
