import { Account } from "convex-hazel/lib/activeRecords/account"
import type {
	ArgsArrayForOptionalValidator,
	DefaultArgsForOptionalValidator,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server"
import type { PropertyValidators, Validator } from "convex/values"

export const withAccount = <
	TContext extends GenericQueryCtx<any> | GenericMutationCtx<any>,
	TArgs extends PropertyValidators | Validator<any, "required", any> | void,
	TResult,
	TOneOrZeroArgs extends ArgsArrayForOptionalValidator<TArgs> = DefaultArgsForOptionalValidator<TArgs>,
>({
	args,
	handler,
}: {
	args: TArgs
	handler: (ctx: TContext & { account: Account }, ...args: TOneOrZeroArgs) => Promise<TResult>
}) => {
	return async (ctx: TContext, ...args: TOneOrZeroArgs): Promise<TResult> => {
		const identity = await ctx.auth.getUserIdentity()
		if (identity === null) {
			throw new Error("Not authenticated")
		}

		const account = await Account.fromIdentity(ctx, identity)

		return await handler({ ...ctx, account }, ...args)
	}
}
