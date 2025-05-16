import { createQuery } from "@rocicorp/zero/solid"
import { type Accessor, createMemo } from "solid-js"
import { CACHE_AWHILE } from "~/lib/zero/query-cache-policy"
import { useZero } from "~/lib/zero/zero-context"

export const useChatMessages = (channelId: Accessor<string>, limit: Accessor<number>) => {
	const z = useZero()

	const [messages, messagesResult] = createQuery(
		() =>
			z.query.messages

				.related("author")
				.related("replyToMessage", (q) => q.related("author"))
				.related("childMessages")
				.related("reactions")
				.related("pinnedInChannels")
				.where(({ cmp }) => cmp("channelId", "=", channelId()))
				.orderBy("createdAt", "desc")
				.limit(limit()),
		CACHE_AWHILE,
	)

	const isLoading = createMemo(() => messagesResult().type !== "complete")

	return { messages, isLoading }
}

export type Message = ReturnType<Awaited<ReturnType<typeof useChatMessages>>["messages"]>[number]
