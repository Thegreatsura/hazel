import { createQuery } from "@rocicorp/zero/solid"
import { type Accessor, createMemo } from "solid-js"
import { CACHE_AWHILE } from "~/lib/zero/query-cache-policy"
import { useZero } from "~/lib/zero/zero-context"
import { useChatMessages } from "./use-chat-messages"

export const useChat = (channelId: Accessor<string>) => {
	const z = useZero()

	const { messages, isLoading: isLoadingMessages } = useChatMessages(channelId, () => 100)

	const [channel, channelResult] = createQuery(
		() => z.query.serverChannels.where(({ cmp }) => cmp("id", "=", channelId())).one(),
		CACHE_AWHILE,
	)

	const [channelMember, channelMemberResult] = createQuery(
		() => z.query.channelMembers.where(({ cmp }) => cmp("channelId", "=", channelId())).one(),
		CACHE_AWHILE,
	)

	const isLoading = createMemo(
		() => isLoadingMessages() && channelMemberResult().type !== "complete" && channelResult().type !== "complete",
	)

	const isChannelLoading = createMemo(() => channelResult().type !== "complete")

	return {
		channel,
		isLoading,
		isChannelLoading,
		channelMember,
		messages,
	}
}
