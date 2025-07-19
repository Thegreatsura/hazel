import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { query } from "./_generated/server"
import { accountMutation, accountQuery } from "./middleware/withAccount"
import { organizationServerQuery } from "./middleware/withOrganizationServer"

export const getServer = accountQuery({
	args: {
		serverId: v.id("servers"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("servers")
			.withIndex("by_id", (q) => q.eq("_id", args.serverId))
			.first()
	},
})

export const getServers = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		return await ctx.db.query("servers").paginate(args.paginationOpts)
	},
})

export const getServerForUser = accountQuery({
	args: {
		serverId: v.id("servers"),
	},
	handler: async (ctx, args) => {
		const serverMember = await ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) =>
				q.eq("accountId", ctx.account.doc._id).eq("serverId", args.serverId),
			)
			.first()

		if (!serverMember) return null

		const server = await ctx.db.get(serverMember.serverId)

		return server
	},
})

export const getServersForUser = accountQuery({
	args: {},
	handler: async (ctx) => {
		const serverMembers = await ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) => q.eq("accountId", ctx.account.doc._id))
			.collect()

		const servers = await Promise.all(
			serverMembers.map(async (member) => {
				const server = await ctx.db.get(member.serverId)
				return server
			}),
		)

		return servers.filter((server) => server !== null)
	},
})

export const getServerFromOrganization = accountQuery({
	args: {
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		const server = await ctx.db
			.query("servers")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
			.first()

		if (!server) return null

		const serverMember = await ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) =>
				q.eq("accountId", ctx.account.doc._id).eq("serverId", server?._id),
			)
			.first()

		if (!serverMember) return null

		return server
	},
})

export const getCurrentServer = organizationServerQuery({
	args: {},
	handler: async (ctx) => {
		return ctx.server
	},
})

export const createServer = accountMutation({
	args: {
		name: v.string(),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const organizationId = ctx.identity.organizationId as string | undefined

		if (!organizationId) {
			throw new Error("You must be part of an organization to create a server")
		}

		const serverId = await ctx.db.insert("servers", {
			name: args.name,
			imageUrl: args.imageUrl,
			organizationId: organizationId,
			updatedAt: Date.now(),
		})

		// Create the owner user for this server
		await ctx.db.insert("users", {
			accountId: ctx.account.doc._id,
			serverId: serverId,
			displayName: ctx.account.doc.displayName,
			tag: ctx.account.doc.displayName,
			avatarUrl: ctx.account.doc.avatarUrl,
			role: "owner",
			status: "online",
			joinedAt: Date.now(),
			lastSeen: Date.now(),
		})

		await ctx.db.insert("channels", {
			serverId: serverId,
			name: "general",
			type: "public",
			updatedAt: Date.now(),
			pinnedMessages: [],
		})

		return serverId
	},
})
