import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { paginationOptsValidator } from "convex/server"
import { withAccount } from "./middleware/withAccount"

export const getServers = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		return await ctx.db.query("servers").paginate(args.paginationOpts)
	},
})

export const createServer = mutation(
	withAccount({
		args: {
			name: v.string(),
			slug: v.string(),
			imageUrl: v.optional(v.string()),
		},
		handler: async (ctx, args) => {
			const serverId = await ctx.db.insert("servers", {
				name: args.name,
				slug: args.slug,
				imageUrl: args.imageUrl,
				updatedAt: Date.now(),
			})

			const user = await ctx.account.createUserFromAccount({ ctx, serverId })

			await ctx.db.patch(serverId, {
				creatorId: user,
			})

			return serverId
		},
	}),
)
