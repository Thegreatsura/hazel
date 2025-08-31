import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import {
	Attachment,
	ChannelMember,
	DirectMessageParticipant,
	Invitation,
	Message,
	Notification,
	Organization,
	OrganizationMember,
	PinnedMessage,
	User,
} from "@hazel/db/models"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { createCollection } from "@tanstack/react-db"
import { Effect, Schema } from "effect"
import { backendClient } from "~/lib/client"
import { convexQueryOptions } from "."

const electricUrl =
	"https://api.electric-sql.cloud/v1/shape?source_id=382e0de8-797d-4395-9a5e-dafa86df0821&secret=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzb3VyY2VfaWQiOiIzODJlMGRlOC03OTdkLTQzOTUtOWE1ZS1kYWZhODZkZjA4MjEiLCJpYXQiOjE3NTY0MTkzMTJ9.Mgw0AAyt-vDM8In0G5BZN7FK6oYkvZV5Lw1sE4wRT6c"

export const channelCollection = (organizationId: Id<"organizations">) =>
	createCollection({
		...queryCollectionOptions({
			...convexQueryOptions(api.channels.list, { organizationId }),
			getKey: (channel) => channel._id,
		}),
	})

export const organizationCollection = createCollection(
	electricCollectionOptions({
		id: "organizations",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "organizations",
			},
		},
		schema: Schema.standardSchemaV1(Organization.Model.json),
		getKey: (item) => item.id,
	}),
)

export const invitationCollection = createCollection(
	electricCollectionOptions({
		id: "invitations",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "invitations",
			},
		},
		schema: Schema.standardSchemaV1(Invitation.Model.json),
		getKey: (item) => item.id,
	}),
)

export const messageCollection = createCollection(
	electricCollectionOptions({
		id: "messages",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "messages",
			},
		},
		schema: Schema.standardSchemaV1(Message.Model.json),
		getKey: (item) => item.id,
		onInsert: async ({ transaction }) => {
			const { modified: newMessage } = transaction.mutations[0]
			const results = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* backendClient

					return yield* client.messages.create({
						payload: newMessage,
					})
				}),
			)

			return { txid: results.transactionId }
		},
	}),
)

export const pinnedMessageCollection = createCollection(
	electricCollectionOptions({
		id: "pinned_messages",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "pinned_messages",
			},
		},
		schema: Schema.standardSchemaV1(PinnedMessage.Model.json),
		getKey: (item) => item.id,
	}),
)

export const notificationCollection = createCollection(
	electricCollectionOptions({
		id: "notifications",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "notifications",
			},
		},
		schema: Schema.standardSchemaV1(Notification.Model.json),
		getKey: (item) => item.id,
	}),
)

export const userCollection = createCollection(
	electricCollectionOptions({
		id: "users",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "users",
			},
		},
		schema: Schema.standardSchemaV1(User.Model.json),
		getKey: (item) => item.id,
	}),
)

export const organizationMemberCollection = createCollection(
	electricCollectionOptions({
		id: "organization_members",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "organization_members",
			},
		},
		schema: Schema.standardSchemaV1(OrganizationMember.Model.json),
		getKey: (item) => item.id,
	}),
)

export const channelMemberCollection = createCollection(
	electricCollectionOptions({
		id: "channel_members",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "channel_members",
			},
		},
		schema: Schema.standardSchemaV1(ChannelMember.Model.json),
		getKey: (item) => item.id,
	}),
)

export const attachmentCollection = createCollection(
	electricCollectionOptions({
		id: "attachments",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "attachments",
			},
		},
		schema: Schema.standardSchemaV1(Attachment.Model.json),
		getKey: (item) => item.id,
	}),
)

export const directMessageParticipantCollection = createCollection(
	electricCollectionOptions({
		id: "direct_message_participants",
		shapeOptions: {
			url: electricUrl,
			params: {
				table: "direct_message_participants",
			},
		},
		schema: Schema.standardSchemaV1(DirectMessageParticipant.Model.json),
		getKey: (item) => item.id,
	}),
)
