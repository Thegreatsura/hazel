import { createFileRoute, useParams } from "@tanstack/solid-router"
import { Show, createEffect, createMemo } from "solid-js"
import { ChatTopbar } from "~/components/chat-ui/chat-topbar"

import { ChatProvider, useChat } from "~/components/chat-ui/chat-store"
import { ImageViewerModal } from "~/components/chat-ui/image-viewer-modal"
import { IconX } from "~/components/icons/x"
import { Button } from "~/components/ui/button"
import { useChatMessage } from "~/lib/hooks/data/use-chat-message"
import { Channel } from "./-components/channel"

export const Route = createFileRoute("/_app/$serverId/chat/$id")({
	component: Root,
})

function Root() {
	const params = useParams({ from: "/_app/$serverId/chat/$id" })
	return (
		<ChatProvider channelId={params().id}>
			<RouteComponent />
		</ChatProvider>
	)
}

function RouteComponent() {
	const { state } = useChat()

	const params = useParams({ from: "/_app/$serverId/chat/$id" })
	const serverId = createMemo(() => params().serverId)
	const channelId = createMemo(() => params().id)

	return (
		<div class="flex h-screen flex-col">
			<ChatTopbar />
			<div class="flex flex-1">
				<Channel channelId={channelId} serverId={serverId} />
				<Show when={state.openThreadId}>
					<ThreadChannel channelId={state.openThreadId!} serverId={serverId()} />
				</Show>
			</div>
			<ChatImageViewerModal />
		</div>
	)
}

function ChatImageViewerModal() {
	const { state, setState } = useChat()

	const messageId = createMemo(() => state.imageDialog.messageId!)

	const { message } = useChatMessage(messageId)

	return (
		<Show when={message()}>
			<ImageViewerModal
				selectedImage={() => state.imageDialog.selectedImage}
				onOpenChange={() =>
					setState("imageDialog", (prev) => ({
						...prev,
						open: false,
						messageId: null,
						selectedImage: null,
					}))
				}
				author={message()!.author}
				createdAt={message()!.createdAt!}
				bucketUrl={import.meta.env.VITE_BUCKET_URL}
			/>
		</Show>
	)
}

function ThreadChannel(props: { channelId: string; serverId: string }) {
	const { setState } = useChat()

	const channelId = createMemo(() => props.channelId)
	const serverId = createMemo(() => props.serverId)

	return (
		<div class="flex flex-1 flex-col border-l">
			<div class="flex items-center justify-between border-b bg-sidebar p-4">
				<p>Thread</p>
				<Button intent="ghost" size="icon-small" onClick={() => setState("openThreadId", null)}>
					<IconX class="size-4" />
				</Button>
			</div>
			<Channel channelId={channelId} serverId={serverId} />
		</div>
	)
}
