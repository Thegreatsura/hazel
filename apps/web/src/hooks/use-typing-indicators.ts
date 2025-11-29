import type { ChannelMember, User } from "@hazel/domain/models"
import type { ChannelId } from "@hazel/schema"
import { eq, useLiveQuery } from "@tanstack/react-db"
import { channelMemberCollection, typingIndicatorCollection, userCollection } from "~/db/collections"
import { useAuth } from "~/lib/auth"

type TypingUser = {
	user: typeof User.Model.Type
	member: typeof ChannelMember.Model.Type
}

export type TypingUsers = TypingUser[]

interface UseTypingIndicatorsOptions {
	channelId: ChannelId
	staleThreshold?: number // Milliseconds after which indicators are considered stale
}

export function useTypingIndicators({ channelId, staleThreshold = 5000 }: UseTypingIndicatorsOptions) {
	const { user: currentUser } = useAuth()

	const { data: typingIndicatorsData } = useLiveQuery(
		(q) =>
			q
				.from({ typing: typingIndicatorCollection })
				.where(({ typing }) => eq(typing.channelId, channelId))
				.orderBy(({ typing }) => typing.lastTyped, "desc")
				.limit(10),
		[channelId],
	)

	const { data: channelMembersData } = useLiveQuery(
		(q) =>
			q
				.from({ member: channelMemberCollection })
				.where(({ member }) => eq(member.channelId, channelId))
				.orderBy(({ member }) => member.createdAt, "desc"),
		[channelId],
	)

	const { data: usersData } = useLiveQuery(
		(q) =>
			q
				.from({ user: userCollection })
				.orderBy(({ user }) => user.createdAt, "desc")
				.limit(100),
		[],
	)

	// Calculate during render - React Compiler handles memoization
	const currentChannelMember = (() => {
		if (!currentUser?.id || !channelMembersData) return null
		return channelMembersData.find((m) => m.userId === currentUser.id)
	})()

	// Calculate during render - data updates trigger re-renders via live queries
	const typingUsers: TypingUsers = (() => {
		if (!typingIndicatorsData || !channelMembersData || !usersData) return []

		const threshold = Date.now() - staleThreshold

		return typingIndicatorsData
			.filter((indicator) => {
				// Filter out stale indicators
				if (indicator.lastTyped < threshold) return false
				// Filter out current user
				if (currentChannelMember && indicator.memberId === currentChannelMember.id) return false
				return true
			})
			.map((indicator) => {
				const member = channelMembersData.find((m) => m.id === indicator.memberId)
				if (!member) return null
				const user = usersData.find((u) => u.id === member.userId)
				if (!user) return null
				return { member, user }
			})
			.filter((tu): tu is TypingUser => tu !== null)
	})()

	return {
		typingUsers,
		isAnyoneTyping: typingUsers.length > 0,
	}
}
