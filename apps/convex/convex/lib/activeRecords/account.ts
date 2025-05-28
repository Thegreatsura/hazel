import type { Doc, Id } from "convex-hazel/_generated/dataModel"
import type { GenericContext } from "./user"
import type { UserIdentity } from "convex/server"
import type { MutationCtx } from "convex-hazel/_generated/server"

export class Account {
	private constructor(public readonly doc: Doc<"accounts">) {}

	public get id() {
		return this.doc._id
	}

	static async fromIdentity(ctx: GenericContext, identity: UserIdentity) {
		const account = await ctx.db
			.query("accounts")
			.withIndex("bg_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique()

		if (!account) throw new Error("Account not found")

		return new Account(account)
	}

	public async validateCanViewAccount(args: { ctx: GenericContext; userId: Id<"accounts"> }) {
		if (args.userId !== this.doc._id) {
			throw new Error("You do not have permission to view this account")
		}
	}

	public async createUserFromAccount(args: { ctx: MutationCtx; serverId: Id<"servers"> }) {
		return await args.ctx.db.insert("users", {
			accountId: this.id,
			serverId: args.serverId,

			displayName: this.doc.displayName,
			tag: this.doc.displayName,
			avatarUrl: this.doc.avatarUrl,

			role: "member",
			status: "online",

			joinedAt: Date.now(),
			lastSeen: Date.now(),
		})
	}
}
