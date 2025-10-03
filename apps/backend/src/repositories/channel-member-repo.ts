import { and, Database, eq, isNull, ModelRepository, schema, type TransactionClient } from "@hazel/db"
import { ChannelMember } from "@hazel/db/models"
import { type ChannelId, policyRequire, type UserId } from "@hazel/db/schema"
import { Effect, Option } from "effect"
import { DatabaseLive } from "../services/database"

type TxFn = <T>(fn: (client: TransactionClient) => Promise<T>) => Effect.Effect<T, any, never>

export class ChannelMemberRepo extends Effect.Service<ChannelMemberRepo>()("ChannelMemberRepo", {
	accessors: true,
	effect: Effect.gen(function* () {
		const baseRepo = yield* ModelRepository.makeRepository(
			schema.channelMembersTable,
			ChannelMember.Model,
			{
				idColumn: "id",
				name: "ChannelMember",
			},
		)
		const db = yield* Database.Database

		// Extended method to find channel member by channel and user
		const findByChannelAndUser = (channelId: ChannelId, userId: UserId, tx?: TxFn) =>
			db
				.makeQuery(
					(execute, data: { channelId: ChannelId; userId: UserId }) =>
						execute((client) =>
							client
								.select()
								.from(schema.channelMembersTable)
								.where(
									and(
										eq(schema.channelMembersTable.channelId, data.channelId),
										eq(schema.channelMembersTable.userId, data.userId),
										isNull(schema.channelMembersTable.deletedAt),
									),
								)
								.limit(1),
						),
					policyRequire("ChannelMember", "select"),
				)({ channelId, userId }, tx)
				.pipe(Effect.map((results) => Option.fromNullable(results[0])))

		return {
			...baseRepo,
			findByChannelAndUser,
		}
	}),
	dependencies: [DatabaseLive],
}) {}
