import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { userMutation, userQuery } from "./middleware/withUser"

export const getMessages = userQuery({
	args: {
		serverId: v.id("servers"),

		channelId: v.id("channels"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const channel = await ctx.db.get(args.channelId)
		if (!channel) throw new Error("Channel not found")

		await ctx.user.validateCanViewChannel({ ctx, channelId: args.channelId })

		// TODO: Set limits on pagination numbers
		const messages = await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("channelId"), args.channelId))
			.order("desc")
			.paginate(args.paginationOpts)

		return messages
	},
})

export const createMessage = userMutation({
	args: {
		serverId: v.id("servers"),

		content: v.string(),
		channelId: v.id("channels"),
		threadChannelId: v.optional(v.id("channels")),
		authorId: v.id("users"),
		replyToMessageId: v.optional(v.id("messages")),
		attachedFiles: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.user.validateCanViewChannel({ ctx, channelId: args.channelId })

		const messageId = await ctx.db.insert("messages", {
			channelId: args.channelId,
			content: args.content,
			threadChannelId: args.threadChannelId,
			authorId: args.authorId,
			replyToMessageId: args.replyToMessageId,
			attachedFiles: args.attachedFiles,
			updatedAt: Date.now(),
			reactions: [],
		})

		return messageId
	},
})

export const updateMessage = userMutation({
	args: {
		serverId: v.id("servers"),

		id: v.id("messages"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.user.validateOwnsMessage({ ctx, messageId: args.id })

		await ctx.db.patch(args.id, {
			content: args.content,
		})
	},
})

export const deleteMessage = userMutation({
	args: {
		serverId: v.id("servers"),

		id: v.id("messages"),
	},
	handler: async (ctx, args) => {
		await ctx.user.validateOwnsMessage({ ctx, messageId: args.id })

		await ctx.db.patch(args.id, {
			deletedAt: Date.now(),
		})
	},
})

export const createReaction = userMutation({
	args: {
		serverId: v.id("servers"),

		messageId: v.id("messages"),
		userId: v.id("users"),
		emoji: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		await ctx.user.validateIsMemberOfChannel({ ctx, channelId: message.channelId })

		if (message.reactions.some((reaction) => reaction.userId === args.userId && reaction.emoji === args.emoji)) {
			throw new Error("You have already reacted to this message")
		}

		return await ctx.db.patch(args.messageId, {
			reactions: [...message.reactions, { userId: args.userId, emoji: args.emoji }],
		})
	},
})

export const deleteReaction = userMutation({
	args: {
		serverId: v.id("servers"),

		id: v.id("messages"),
		emoji: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.id)
		if (!message) throw new Error("Message not found")

		await ctx.user.validateIsMemberOfChannel({ ctx, channelId: message.channelId })

		const newReactions = message.reactions.filter(
			(reaction) => !(reaction.emoji === args.emoji && reaction.userId === ctx.user.id),
		)

		if (newReactions.length === message.reactions.length) {
			throw new Error("You do not have permission to delete this reaction")
		}

		return await ctx.db.patch(args.id, {
			reactions: newReactions,
		})
	},
})
