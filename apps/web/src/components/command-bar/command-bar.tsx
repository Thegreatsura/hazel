import type { Id } from "@hazel/backend"
import { type Accessor, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { Command } from "../ui/command-menu"
import { ChannelBar } from "./channel-bar"

const [commandBarState, setCommandBarState] = createStore({
	open: false,
})

export { commandBarState, setCommandBarState }

export const CommandBar = (props: {
	serverId: Accessor<Id<"servers">>
}) => {
	onMount(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setCommandBarState((prev) => ({ ...prev, open: !prev.open }))
			}
		}

		document.addEventListener("keydown", down)
		onCleanup(() => document.removeEventListener("keydown", down))
	})

	return (
		<Command.Dialog
			open={commandBarState.open}
			onOpenChange={(value) => setCommandBarState("open", value.open)}
		>
			<Command.Input />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>

				<ChannelBar serverId={props.serverId} />
			</Command.List>
		</Command.Dialog>
	)
}
