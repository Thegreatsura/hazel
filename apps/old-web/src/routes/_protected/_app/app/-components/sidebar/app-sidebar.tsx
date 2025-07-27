import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/solid-query"
import { Link } from "@tanstack/solid-router"
import { createMemo, createSignal, Index, Suspense } from "solid-js"

import {
	IconChatChatting1,
	IconGridDashboard01DuoSolid,
	IconNotificationBellOn1,
	IconPlusStroke,
} from "~/components/iconsv2"
import { IconButton } from "~/components/ui/button"
import { Dialog } from "~/components/ui/dialog"
import { Sidebar } from "~/components/ui/sidebar"
import { Skeleton } from "~/components/ui/skeleton"
import { Tabs } from "~/components/ui/tabs"
import { usePresenceState } from "~/lib/convex-presence"
import { convexQuery } from "~/lib/convex-query"
import { CreateChannelForm } from "../create-channel-form"
import { CreateDmDialog } from "../create-dm-dialog"
import { JoinPublicChannel } from "../join-public-channel"
import { NavUser } from "../nav-user"
import { WorkspaceSwitcher } from "../workspace-switcher"
import { ChannelItem, DmChannelLink } from "./channel-item"
import { SidebarFavoriteGroup } from "./sidebar-favorite-group"

export const AppSidebar = () => {
	const channelsQuery = useQuery(() =>
		convexQuery(api.channels.getChannelsForOrganization, {
			favoriteFilter: {
				favorite: false,
			},
		}),
	)

	const dmChannels = createMemo(() => channelsQuery.data?.dmChannels || [])

	const [createChannelModalOpen, setCreateChannelModalOpen] = createSignal(false)

	const presenceState = usePresenceState()

	return (
		<Sidebar collapsible="icon" class="overflow-hidden *:data-[sidebar=sidebar]:flex-row">
			<Sidebar collapsible="none" class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
				<Sidebar.Header>
					<Suspense fallback={<Skeleton class="h-12 w-full rounded-md bg-muted" />}>
						<WorkspaceSwitcher />
					</Suspense>
				</Sidebar.Header>
				<Sidebar.Content>
					<Sidebar.Group>
						<Sidebar.GroupContent>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									class="px-2.5 md:px-2"
									as={Link}
									to="/app"
									activeOptions={{
										exact: true,
									}}
								>
									<IconGridDashboard01DuoSolid />
									<span>Home</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton class="px-2.5 md:px-2" as={Link} to="/app/chat">
									<IconChatChatting1 />
									{/* <IconChatChattingDuoSolid /> */}
									<span>Chat</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>
				<Sidebar.Footer>
					<Suspense fallback={<Skeleton class="h-12 w-full rounded-md bg-muted" />}>
						<NavUser />
					</Suspense>
				</Sidebar.Footer>
			</Sidebar>
			<Sidebar collapsible="none" class="hidden flex-1 md:flex">
				<Sidebar.Header class="gap-3.5 p-4">
					<div class="flex w-full items-center justify-between">
						<ActiveServer />
					</div>
				</Sidebar.Header>
				<Sidebar.Content>
					<Suspense
						fallback={
							<div class="flex flex-col gap-2 p-3">
								<Sidebar.MenuSkeleton showIcon />
								<Sidebar.MenuSkeleton showIcon />
								<Sidebar.MenuSkeleton showIcon />
								<Sidebar.MenuSkeleton showIcon />
							</div>
						}
					>
						<Sidebar.Group>
							<Sidebar.GroupContent>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton as={Link} to="/app/notifications">
										<IconNotificationBellOn1 /> Notifications
										<Sidebar.MenuBadge class="rounded-full bg-destructive">
											1
										</Sidebar.MenuBadge>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.GroupContent>
						</Sidebar.Group>
						<SidebarFavoriteGroup />
						<Sidebar.Group>
							<Sidebar.GroupLabel>Channels</Sidebar.GroupLabel>
							<Sidebar.GroupAction>
								<Dialog
									open={createChannelModalOpen()}
									onOpenChange={(details) => setCreateChannelModalOpen(details.open)}
								>
									<Dialog.Trigger
										asChild={(props) => (
											<IconButton class="size-4.5" {...props}>
												<IconPlusStroke />
											</IconButton>
										)}
									/>
									<Dialog.Content>
										<Tabs defaultValue={"join"}>
											<Tabs.List>
												<Tabs.Trigger value="join">Join</Tabs.Trigger>
												<Tabs.Trigger value="create">Create New</Tabs.Trigger>
											</Tabs.List>
											<Tabs.Content value="join">
												<JoinPublicChannel
													onSuccess={() => setCreateChannelModalOpen(false)}
												/>
											</Tabs.Content>
											<Tabs.Content value="create">
												<CreateChannelForm
													onSuccess={() => setCreateChannelModalOpen(false)}
												/>
											</Tabs.Content>
										</Tabs>
									</Dialog.Content>
								</Dialog>
							</Sidebar.GroupAction>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									<Index each={channelsQuery.data?.serverChannels}>
										{(channel) => <ChannelItem channel={channel} />}
									</Index>
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
						<Sidebar.Group>
							<Sidebar.GroupLabel>Direct Messages</Sidebar.GroupLabel>
							<Sidebar.GroupAction>
								<CreateDmDialog />
							</Sidebar.GroupAction>
							<Sidebar.Menu>
								<Index each={dmChannels()}>
									{(channel) => (
										<DmChannelLink
											userPresence={presenceState.presenceList}
											channel={channel}
										/>
									)}
								</Index>
							</Sidebar.Menu>
						</Sidebar.Group>
					</Suspense>
				</Sidebar.Content>
			</Sidebar>
		</Sidebar>
	)
}

const ActiveServer = () => {
	const serverQuery = useQuery(() => convexQuery(api.servers.getCurrentServer, {}))

	return (
		<Suspense>
			<div class="font-semibold text-foreground text-lg">{serverQuery.data?.name}</div>
		</Suspense>
	)
}
