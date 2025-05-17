import { createQuery } from "@rocicorp/zero/solid"
import { useParams } from "@tanstack/solid-router"
import { useAuth } from "clerk-solidjs"
import { For, Match, Show, Switch, createMemo } from "solid-js"
import { useZero } from "~/lib/zero/zero-context"
import { IconGroup } from "../icons/group"
import { IconHashtag } from "../icons/hashtag"
import { IconPhone } from "../icons/phone"
import { IconSearch } from "../icons/search"
import { IconUserPlus } from "../icons/user-plus"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"
import { TextField } from "../ui/text-field"
import { PinnedModal } from "./pinned-modal"

export function ChatTopbar() {
	const params = useParams({ from: "/_app/$serverId/chat/$id" })()
	const z = useZero()

	const { userId } = useAuth()

	const [channel] = createQuery(() => z.query.serverChannels.where("id", "=", params.id).related("users").one())

	if (!channel) {
		return null
	}

	const friends = createMemo(() => channel()?.users.filter((user) => user.id !== userId()) ?? [])
	const isSingleDm = createMemo(() => friends().length === 1)

	return (
		<div class="flex h-16 items-center justify-between gap-2 border-b bg-sidebar p-3">
			<div class="flex items-center gap-2">
				<Switch>
					<Match when={channel()?.channelType === "single" || channel()?.channelType === "direct"}>
						<Show when={isSingleDm()}>
							<Avatar size="sm" src={friends()[0].avatarUrl} name={friends()[0].displayName} />
						</Show>
						<Show when={!isSingleDm()}>
							<div class="-space-x-4 flex items-center justify-center">
								<For each={friends()}>
									{(friend) => (
										<Avatar
											class="ring-background"
											size="sm"
											src={friend.avatarUrl}
											name={friend.displayName}
										/>
									)}
								</For>
							</div>
						</Show>
						<p class="max-w-[120px] truncate text-sidebar-fg">
							{friends()
								.map((friend) => friend.displayName)
								.join(", ")}
						</p>
					</Match>
					<Match when={channel()?.channelType === "private" || channel()?.channelType === "public"}>
						<div class="flex items-center gap-1">
							<IconHashtag class="size-5" />
							<p class="max-w-[120px] truncate">{channel()?.name}</p>
						</div>
					</Match>
				</Switch>
			</div>
			<div class="flex gap-2">
				<Button size="square" intent="ghost">
					<IconPhone />
				</Button>
				<PinnedModal />
				<Button size="square" intent="ghost">
					<IconUserPlus />
				</Button>
				<Button size="square" intent="ghost">
					<IconGroup />
				</Button>
				<div>
					<TextField
						aria-label="Search"
						placeholder="Search"
						suffix={<IconSearch class="mr-2 size-5 text-muted-foreground" />}
					/>
				</div>
			</div>
		</div>
	)
}
