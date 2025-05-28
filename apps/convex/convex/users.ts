import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { withAccount } from "./middleware/withAccount"
export const getUsers = query({
	handler: async (ctx) => {
		return await ctx.db.query("users").collect()
	},
})

export const createUser = mutation(
	withAccount({
		args: {
			serverId: v.id("servers"),
			role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
		},
		handler: async (ctx, args) => {
			// TODO: Add validation here
			return await ctx.account.createUserFromAccount({ ctx, serverId: args.serverId })
		},
	}),
)
