import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { withUser } from "./middleware/withUser"

export const getChannels = query(
	withUser({
		args: {
			serverId: v.id("servers"),
		},
		handler: async (ctx, args) => {
			// TODO: Validate that the user can view the channel
			return await ctx.db
				.query("channels")
				.filter((q) => q.eq(q.field("serverId"), args.serverId))
				.collect()
		},
	}),
)

export const createChannel = mutation(
	withUser({
		args: {
			serverId: v.id("servers"),

			name: v.string(),
			type: v.union(
				v.literal("public"),
				v.literal("private"),
				v.literal("thread"),
				v.literal("direct"),
				v.literal("single"),
			),
			ownerId: v.id("users"),
			parentChannelId: v.optional(v.id("channels")),
		},
		handler: async (ctx, args) => {
			const channelId = await ctx.db.insert("channels", {
				name: args.name,
				serverId: args.serverId,
				type: args.type,
				parentChannelId: args.parentChannelId,
				updatedAt: Date.now(),
			})

			await ctx.db.insert("channelMembers", {
				channelId,
				userId: args.ownerId,
				joinedAt: Date.now(),
				isHidden: false,
				isMuted: false,
			})

			return channelId
		},
	}),
)
