import { createFileRoute, useParams } from "@tanstack/solid-router"
import { createEffect, createMemo, createSignal } from "solid-js"
import { ChatMessage } from "~/components/chat-ui/chat-message"
import { ChatTopbar } from "~/components/chat-ui/chat-topbar"
import { FloatingBar } from "~/components/chat-ui/floating-bar"
import { useChat } from "~/lib/hooks/data/use-chat"
import type { Message } from "~/lib/hooks/data/use-chat-messages"

import { VList, type VListHandle } from "virtua/solid"

export const Route = createFileRoute("/_app/$serverId/chat/$id")({
	component: RouteComponent,
})

export const chatStore$ = createSignal({
	replyToMessageId: null as string | null,
})

const PAGE_SIZE = 30

function RouteComponent() {
	const [limit, setLimit] = createSignal(PAGE_SIZE)

	const params = useParams({ from: "/_app/$serverId/chat/$id" })
	const navigate = Route.useNavigate()

	const channelId = createMemo(() => params().id)
	const { messages, channel, isChannelLoading } = useChat(channelId, limit)

	// Redirect when channel is not found
	createEffect(() => {
		if (!channel() && !isChannelLoading()) {
			navigate({
				to: "/$serverId",
				params: { serverId: params().serverId },
			})
		}
	})

	const processedMessages = createMemo(() => {
		const timeThreshold = 5 * 60 * 1000

		const allMessages = messages()
			.reverse()
			.slice()
			.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())

		const result: Array<{
			message: Message
			isGroupStart: boolean
			isGroupEnd: boolean
		}> = []

		for (let i = 0; i < allMessages.length; i++) {
			const currentMessage = allMessages[i]
			const prevMessage = i > 0 ? allMessages[i - 1] : null
			const nextMessage = i < allMessages.length - 1 ? allMessages[i + 1] : null

			let isGroupStart = true
			if (prevMessage) {
				const currentTime = new Date(currentMessage.createdAt!).getTime()
				const prevTime = new Date(prevMessage.createdAt!).getTime()
				const timeDiff = currentTime - prevTime
				if (currentMessage.authorId === prevMessage.authorId && timeDiff < timeThreshold) {
					isGroupStart = false
				}
			}

			let isGroupEnd = true
			if (nextMessage) {
				const currentTime = new Date(currentMessage.createdAt!).getTime()
				const nextTime = new Date(nextMessage.createdAt!).getTime()
				const timeDiff = nextTime - currentTime
				if (currentMessage.authorId === nextMessage.authorId && timeDiff < timeThreshold) {
					isGroupEnd = false
				}
			}

			result.push({ message: currentMessage, isGroupStart, isGroupEnd })
		}

		return result
	})

	const [shouldStickToBottom, setShouldStickToBottom] = createSignal(true)

	const [vlistRef, setVlistRef] = createSignal<VListHandle | undefined>(undefined)

	createEffect(() => {
		const ref = vlistRef()
		if (!ref) return
		if (!shouldStickToBottom()) return

		ref.scrollToIndex(processedMessages().length - 1, {
			smooth: true,
			align: "end",
		})
	})

	return (
		<div class="flex h-screen flex-col">
			<ChatTopbar />
			<VList
				class="flex-1"
				overscan={5}
				shift
				data={processedMessages()}
				ref={setVlistRef}
				onScroll={async (offset) => {
					if (!vlistRef()) {
						return
					}

					setShouldStickToBottom(offset >= vlistRef()!.scrollSize - vlistRef()!.viewportSize - 120)

					if (offset < 150) {
						if (limit() <= messages().length) {
							setLimit(messages().length + PAGE_SIZE)
						}
					}
				}}
			>
				{(message) => (
					<ChatMessage
						message={message.message}
						isGroupStart={message.isGroupStart}
						isGroupEnd={message.isGroupEnd}
						isFirstNewMessage={false}
						serverId={() => "srv_b6tAwPtTxEpFQfXC"}
					/>
				)}
			</VList>
			<div class="mx-2 mb-6">
				<FloatingBar channelId={params().id} />
			</div>
		</div>
	)
}
