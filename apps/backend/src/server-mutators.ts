import { schema as drizzleSchema } from "@maki-chat/drizzle"
import type { Message, schema } from "@maki-chat/zero"
import type { CustomMutatorDefs } from "@rocicorp/zero"
import Ably from "ably"
import { and, eq } from "drizzle-orm"
import { getDb } from "./lib/database"

export const serverMutators = (clientMutators: CustomMutatorDefs<typeof schema>) =>
	({
		...clientMutators,
		messages: {
			...clientMutators.messages,
			insert: async (tx, data: Message) => {
				const ably = new Ably.Rest("NY2l4Q._SC2Cw:4EX9XKKwif-URelo-XiW7AuAqAjy8QzOheHhnjocjkk")

				await tx.mutate.messages.insert(data)

				// This will run in the background
				const postNotifications = async () => {
					const db = getDb(global.env.HYPERDRIVE.connectionString)

					const channelMembers = await db.query.channelMembers.findMany({
						where: (table, { eq }) => eq(table.channelId, data.channelId!),
					})

					await Promise.all(
						channelMembers.map((member) =>
							db
								.update(drizzleSchema.channelMembers)
								.set({
									channelId: member.channelId,
									userId: member.userId,
									notificationCount: member.notificationCount + 1,
									lastSeenMessageId: member.lastSeenMessageId ?? data.id,
								})
								.where(
									and(
										eq(drizzleSchema.channelMembers.userId, member.userId),
										eq(drizzleSchema.channelMembers.channelId, member.channelId),
									),
								),
						),
					)

					const channels = channelMembers
						.filter((member) => !member.isMuted)
						.map((member) => `notifications:${member.userId}`)

					await ably.batchPublish({
						channels: channels,
						messages: [
							{
								data: {
									...data,
								},
							},
						],
					})
				}

				global.waitUntil(postNotifications())
			},
		},
	}) as const satisfies CustomMutatorDefs<typeof schema>
