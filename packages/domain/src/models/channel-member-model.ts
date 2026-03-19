import { ChannelId, ChannelMemberId, MessageId, UserId } from "@hazel/schema"
import { Schema as S } from "effect"
import * as M from "./utils"
import { JsonDate } from "./utils"

class Model extends M.Class<Model>("ChannelMember")({
	id: M.Generated(ChannelMemberId),
	channelId: M.Immutable(ChannelId),
	userId: M.Immutable(UserId),
	isHidden: S.Boolean,
	isMuted: S.Boolean,
	isFavorite: S.Boolean,
	lastSeenMessageId: S.NullOr(MessageId),
	notificationCount: M.GeneratedByApp(S.Number),
	joinedAt: M.Immutable(JsonDate),
	createdAt: M.Generated(JsonDate),
	deletedAt: M.GeneratedByApp(S.NullOr(JsonDate)),
}) {}

export const { Insert, Update, Schema, Create, Patch, PatchPartial } = M.expose(Model)
export type Type = typeof Schema.Type
