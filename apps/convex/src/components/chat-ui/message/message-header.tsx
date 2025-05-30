import type { Doc } from "convex-hazel/_generated/dataModel"
import { type Accessor, Show, createMemo } from "solid-js"

interface MessageHeaderProps {
	message: Accessor<Doc<"messages">>
	showAvatar: Accessor<boolean>
	serverId: Accessor<string>
}

export function MessageHeader(props: MessageHeaderProps) {
	const messageTime = createMemo(() => {
		return new Date(props.message()._creationTime).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		})
	})

	const authorId = createMemo(() => props.message().authorId)

	return (
		<>
			<Show when={props.showAvatar()}>
				<UserAvatar user={author()} serverId={props.serverId} />
			</Show>
			<Show when={!props.showAvatar()}>
				<div class="flex w-10 items-center justify-end pr-1 text-[10px] text-muted-foreground leading-tight opacity-0 group-hover:opacity-100">
					{messageTime()}
				</div>
			</Show>
		</>
	)
}
