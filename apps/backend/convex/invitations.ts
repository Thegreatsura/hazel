import { v } from "convex/values"
import { internal } from "./_generated/api"
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

		// First, revoke the existing invitation in WorkOS
		const revokeResult = await ctx.runAction(internal.workosActions.revokeWorkosInvitation, {
			invitationId: invitation.workosInvitationId,
		})

		if (!revokeResult.success) {
			// If revoke fails, it might already be expired/revoked in WorkOS
			console.warn("Failed to revoke invitation in WorkOS:", revokeResult.error)
		}

		// Send a new invitation
		const sendResult = await ctx.runAction(internal.workosActions.sendInvitation, {
			email: invitation.email,
			organizationId: ctx.organization.workosId,
			role: invitation.role,
			inviterUserId: ctx.account.doc.externalId,
		})

		if (!sendResult.success) {
			throw new Error(`Failed to resend invitation: ${sendResult.error}`)
		}

		// Update the local invitation with new WorkOS ID and expiration
		await ctx.db.patch(args.invitationId, {
			workosInvitationId: sendResult.invitation.id,
			expiresAt: new Date(sendResult.invitation.expiresAt).getTime(),
			invitedAt: Date.now(),
		})

		return { success: true, message: "Invitation resent successfully" }
	},
})

export const revokeInvitation = organizationServerMutation({
	args: {
		invitationId: v.id("invitations"),
	},
	handler: async (ctx, args) => {
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

		// Revoke the invitation in WorkOS
		const revokeResult = await ctx.runAction(internal.workosActions.revokeWorkosInvitation, {
			invitationId: invitation.workosInvitationId,
		})

		if (!revokeResult.success) {
			throw new Error(`Failed to revoke invitation: ${revokeResult.error}`)
		}

		// Update status to revoked
		await ctx.db.patch(args.invitationId, {
			status: "revoked",
		})

		return { success: true, message: "Invitation revoked successfully" }
	},
})