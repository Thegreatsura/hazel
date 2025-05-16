import { createFileRoute } from "@tanstack/solid-router"
import { useChatMessages } from "~/lib/hooks/data/use-chat-messages"

import { createEffect, createMemo, createSignal, on } from "solid-js"
import { VList, type VListHandle } from "virtua/solid"

export const Route = createFileRoute("/virtualized")({
	component: RouteComponent,
})

const PAGE_SIZE = 10

function RouteComponent() {
	const [limit, setLimit] = createSignal(PAGE_SIZE)
	const { messages } = useChatMessages(() => "cha_2xsesAW65pajuEFu", limit)

	const reversedMessages = createMemo(() => [...messages()].reverse())

	const [shouldStickToBottom, setShouldStickToBottom] = createSignal(true)

	const [vlistRef, setVlistRef] = createSignal<VListHandle | undefined>(undefined)

	createEffect(() => {
		const ref = vlistRef()
		if (!ref) return
		if (!shouldStickToBottom()) return

		ref.scrollToIndex(reversedMessages().length - 1, {
			smooth: true,
			align: "end",
		})
	})

	return (
		<div class="flex h-screen flex-col">
			<VList
				class="flex-1"
				overscan={5}
				shift
				data={reversedMessages()}
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
				{(message, index) => (
					<div class="border border-blue-600 bg-primary p-12">
						{message.content} {index()}
					</div>
				)}
			</VList>
		</div>
	)
}
