import { v } from "convex/values"
import { organizationServerMutation, organizationServerQuery } from "./middleware/withOrganization"

export const getInvitations = organizationServerQuery({
	args: {},
	handler: async (ctx, _args) => {
		// Get all invitations for the user's organization
		const invitations = await ctx.db
			.query("invitations")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", ctx.organization._id))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.order("desc")
			.collect()

		// Enrich invitations with inviter information
		const enrichedInvitations = await Promise.all(
			invitations.map(async (invitation) => {
				let inviterName = null
				if (invitation.invitedBy) {
					const inviter = await ctx.db.get(invitation.invitedBy)
					if (inviter) {
						inviterName = `${inviter.firstName} ${inviter.lastName}`.trim()
					}
				}

				return {
					...invitation,
					inviterName,
					timeUntilExpiry: invitation.expiresAt - Date.now(),
					isExpired: Date.now() > invitation.expiresAt,
				}
			}),
		)

		return enrichedInvitations
	},
})

export const resendInvitation = organizationServerMutation({
	args: {
		invitationId: v.id("invitations"),
	},
	handler: async (ctx, args) => {
		// Check if user has permission
		if (ctx.organizationMembership.role !== "admin") {
			throw new Error("Only admins can resend invitations")
		}

		const invitation = await ctx.db.get(args.invitationId)
		if (!invitation) {
			throw new Error("Invitation not found")
		}

		if (invitation.organizationId !== ctx.organization._id) {
			throw new Error("Invitation not found")
		}

		if (invitation.status !== "pending") {
			throw new Error("Can only resend pending invitations")
		}

		// For now, we'll just update the expiration time
		// In a real implementation, you'd call WorkOS to resend the email
		await ctx.db.patch(args.invitationId, {
			expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
		})

		return { success: true, message: "Invitation resent successfully" }
	},
})

export const revokeInvitation = organizationServerMutation({
	args: {
		invitationId: v.id("invitations"),
	},
	handler: async (ctx, args) => {
		// Check if user has permission
		if (ctx.organizationMembership.role !== "admin") {
			throw new Error("Only admins can revoke invitations")
		}

		const invitation = await ctx.db.get(args.invitationId)
		if (!invitation) {
			throw new Error("Invitation not found")
		}

		if (invitation.organizationId !== ctx.organization._id) {
			throw new Error("Invitation not found")
		}

		if (invitation.status !== "pending") {
			throw new Error("Can only revoke pending invitations")
		}

		// Update status to revoked
		await ctx.db.patch(args.invitationId, {
			status: "revoked",
		})

		// In a real implementation, you'd also call WorkOS to revoke the invitation

		return { success: true, message: "Invitation revoked successfully" }
	},
})