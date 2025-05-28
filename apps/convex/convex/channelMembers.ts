import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { withUser } from "./middleware/withUser"

export const getChannelMembers = query({
	handler: async (ctx) => {
		return await ctx.db.query("channelMembers").collect()
	},
})

export const createChannelMember = mutation(
	withUser({
		args: {
			userId: v.id("users"),
			channelId: v.id("channels"),
			isHidden: v.boolean(),
			isMuted: v.boolean(),
			joinedAt: v.number(),

			serverId: v.id("servers"),
		},
		handler: async (ctx, args) => {
			await ctx.user.validateIsMemberOfChannel({ ctx, channelId: args.channelId })

			return await ctx.db.insert("channelMembers", {
				userId: args.userId,
				channelId: args.channelId,
				isHidden: args.isHidden,
				isMuted: args.isMuted,
				joinedAt: args.joinedAt,
			})
		},
	}),
)
