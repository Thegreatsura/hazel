"use client"

import { useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import type { ChannelId, UserId } from "@hazel/schema"
import { and, eq, inArray, not, or, useLiveQuery } from "@tanstack/react-db"
import { useNavigate } from "@tanstack/react-router"
import { type } from "arktype"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ColorSwatch } from "react-aria-components"
import { toast } from "sonner"
import { createDmChannelMutation } from "~/atoms/channel-atoms"
import { type CommandPalettePage, commandPaletteAtom, isFormPage } from "~/atoms/command-palette-atoms"
import { useModal } from "~/atoms/modal-atoms"
import { recentChannelsAtom } from "~/atoms/recent-channels-atom"
import {
	CommandMenu,
	CommandMenuItem,
	CommandMenuLabel,
	CommandMenuList,
	type CommandMenuProps,
	CommandMenuSearch,
	CommandMenuSection,
	CommandMenuShortcut,
} from "~/components/ui/command-menu"
import {
	CommandMenuFormBody,
	CommandMenuFormContainer,
	CommandMenuFormField,
	CommandMenuFormFooter,
	CommandMenuFormHeader,
	CommandMenuInput,
	CommandMenuToggle,
} from "~/components/ui/command-menu-form"
import { createChannelAction, joinChannelAction } from "~/db/actions"
import {
	channelCollection,
	channelMemberCollection,
	organizationMemberCollection,
	userCollection,
	userPresenceStatusCollection,
} from "~/db/collections"
import { useAppForm } from "~/hooks/use-app-form"
import { useOrganization } from "~/hooks/use-organization"
import { usePresence } from "~/hooks/use-presence"
import { useAuth } from "~/lib/auth"
import { findExistingDmChannel } from "~/lib/channels"
import { matchExitWithToast, toastExit } from "~/lib/toast-exit"
import { cn } from "~/lib/utils"
import { ChannelIcon } from "./channel-icon"
import IconHashtag from "./icons/icon-hashtag"
import IconLock from "./icons/icon-lock"
import { type Theme, useTheme } from "./theme-provider"
import { Button } from "./ui/button"
import IconBell from "./icons/icon-bell"
import IconCircleDottedUser from "./icons/icon-circle-dotted-user"
import IconDashboard from "./icons/icon-dashboard"
import IconGear from "./icons/icon-gear"
import IconIntegration from "./icons/icon-integratio-"
import IconMsgs from "./icons/icon-msgs"
import IconPlus from "./icons/icon-plus"
import { IconServers } from "./icons/icon-servers"
import IconUsersPlus from "./icons/icon-users-plus"
import { Avatar } from "./ui/avatar"

type Page = "home" | "channels" | "members" | "status" | "appearance" | "create-channel" | "join-channel"

export function CommandPalette(
	props: Pick<CommandMenuProps, "isOpen" | "onOpenChange"> & { initialPage?: CommandPalettePage },
) {
	// Use atoms for state management with hook-based updates
	const { currentPage, inputValue } = useAtomValue(commandPaletteAtom)
	const setCommandPaletteState = useAtomSet(commandPaletteAtom)

	const navigateToPage = useCallback(
		(page: Page) => {
			setCommandPaletteState((state) => ({
				...state,
				currentPage: page,
				pageHistory: [...state.pageHistory, state.currentPage],
				inputValue: "",
			}))
		},
		[setCommandPaletteState],
	)

	const goBack = useCallback(() => {
		setCommandPaletteState((state) => {
			if (state.pageHistory.length === 0) return state

			const previousPage = state.pageHistory[state.pageHistory.length - 1]
			return {
				...state,
				currentPage: previousPage || "home",
				pageHistory: state.pageHistory.slice(0, -1),
				inputValue: "",
			}
		})
	}, [setCommandPaletteState])

	const updateSearchInput = useCallback(
		(value: string) => {
			setCommandPaletteState((state) => ({
				...state,
				inputValue: value,
			}))
		},
		[setCommandPaletteState],
	)

	const closePalette = useCallback(() => {
		props.onOpenChange?.(false)
	}, [props])

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				// Reset to initial page when opening
				setCommandPaletteState({
					currentPage: props.initialPage || "home",
					pageHistory: [],
					inputValue: "",
				})
			}
			props.onOpenChange?.(open)
		},
		[props, setCommandPaletteState],
	)

	// Handle ESC key to go back
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && currentPage !== "home" && props.isOpen) {
				e.preventDefault()
				e.stopPropagation()
				goBack()
			}
		}

		document.addEventListener("keydown", handleKeyDown, { capture: true })
		return () => document.removeEventListener("keydown", handleKeyDown, { capture: true })
	}, [currentPage, goBack, props.isOpen])

	const searchPlaceholder = useMemo(() => {
		switch (currentPage) {
			case "channels":
				return "Search channels..."
			case "members":
				return "Search members..."
			case "status":
				return "Set your status..."
			case "appearance":
				return "Change appearance..."
			default:
				return "Where would you like to go?"
		}
	}, [currentPage])

	const isCurrentPageForm = isFormPage(currentPage)

	return (
		<CommandMenu
			key={currentPage}
			shortcut="k"
			inputValue={inputValue}
			onInputChange={updateSearchInput}
			isOpen={props.isOpen}
			onOpenChange={handleOpenChange}
			isFormPage={isCurrentPageForm}
		>
			{isCurrentPageForm ? (
				// Form pages render their own header/content outside CommandMenuList
				<>
					{currentPage === "create-channel" && (
						<CreateChannelView onClose={closePalette} onBack={goBack} />
					)}
					{currentPage === "join-channel" && (
						<JoinChannelView onClose={closePalette} onBack={goBack} />
					)}
				</>
			) : (
				// List pages use the search input and menu list
				<>
					<CommandMenuSearch placeholder={searchPlaceholder} />
					<CommandMenuList>
						{currentPage === "home" && (
							<HomeView navigateToPage={navigateToPage} onClose={closePalette} />
						)}
						{currentPage === "channels" && <ChannelsView onClose={closePalette} />}
						{currentPage === "members" && <MembersView onClose={closePalette} />}
						{currentPage === "status" && <StatusView onClose={closePalette} />}
						{currentPage === "appearance" && <AppearanceView onClose={closePalette} />}
					</CommandMenuList>
				</>
			)}
		</CommandMenu>
	)
}

function HomeView({
	navigateToPage,
	onClose,
}: {
	navigateToPage: (page: Page) => void
	onClose: () => void
}) {
	const { slug: orgSlug, organizationId } = useOrganization()
	const { user } = useAuth()
	const navigate = useNavigate()
	const recentChannels = useAtomValue(recentChannelsAtom)

	// Modal hooks for quick actions (only for those not inline)
	const createDmModal = useModal("create-dm")
	const emailInviteModal = useModal("email-invite")

	// Get channel data for recent channels
	const recentChannelIds = recentChannels.map((rc) => rc.channelId)
	const { data: recentChannelData } = useLiveQuery(
		(q) =>
			recentChannelIds.length > 0 && organizationId
				? q
						.from({ channel: channelCollection })
						.where(({ channel }) => eq(channel.organizationId, organizationId))
						.select(({ channel }) => channel)
				: null,
		[recentChannelIds.length, organizationId],
	)

	// Sort and filter recent channels by visitedAt order
	const sortedRecentChannels = useMemo(() => {
		if (!recentChannelData) return []
		return recentChannels
			.map((rc) => recentChannelData.find((c) => c.id === rc.channelId))
			.filter((c): c is NonNullable<typeof c> => c !== undefined)
			.slice(0, 5)
	}, [recentChannelData, recentChannels])

	return (
		<>
			{/* Quick Actions */}
			<CommandMenuSection label="Quick Actions">
				<CommandMenuItem onAction={() => navigateToPage("create-channel")} textValue="create channel">
					<IconPlus />
					<CommandMenuLabel>Create channel</CommandMenuLabel>
					<CommandMenuShortcut>⌘⌥N</CommandMenuShortcut>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						createDmModal.open()
						onClose()
					}}
					textValue="start conversation new dm"
				>
					<IconMsgs />
					<CommandMenuLabel>Start conversation</CommandMenuLabel>
					<CommandMenuShortcut>⌘⌥D</CommandMenuShortcut>
				</CommandMenuItem>
				<CommandMenuItem onAction={() => navigateToPage("join-channel")} textValue="join channel">
					<IconPlus />
					<CommandMenuLabel>Join channel</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						emailInviteModal.open()
						onClose()
					}}
					textValue="invite members"
				>
					<IconUsersPlus />
					<CommandMenuLabel>Invite members</CommandMenuLabel>
					<CommandMenuShortcut>⌘⌥I</CommandMenuShortcut>
				</CommandMenuItem>
			</CommandMenuSection>

			{/* Recent Channels */}
			{sortedRecentChannels.length > 0 && (
				<CommandMenuSection label="Recent">
					{sortedRecentChannels.map((channel) => (
						<CommandMenuItem
							key={channel.id}
							textValue={channel.name}
							onAction={() => {
								navigate({
									to: "/$orgSlug/chat/$id",
									params: { orgSlug: orgSlug!, id: channel.id },
								})
								onClose()
							}}
						>
							<ChannelIcon icon={channel.icon} />
							<CommandMenuLabel>{channel.name}</CommandMenuLabel>
						</CommandMenuItem>
					))}
				</CommandMenuSection>
			)}

			{/* Browse */}
			<CommandMenuSection label="Browse">
				<CommandMenuItem onAction={() => navigateToPage("channels")} textValue="browse channels">
					<IconMsgs />
					<CommandMenuLabel>Browse channels...</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem onAction={() => navigateToPage("members")} textValue="browse members">
					<IconUsersPlus />
					<CommandMenuLabel>Browse members...</CommandMenuLabel>
				</CommandMenuItem>
			</CommandMenuSection>

			{/* Navigation */}
			<CommandMenuSection label="Navigation">
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="dashboard home"
				>
					<IconDashboard />
					<CommandMenuLabel>Dashboard</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/chat", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="chat messages"
				>
					<IconMsgs />
					<CommandMenuLabel>Chat</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/notifications", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="notifications"
				>
					<IconBell />
					<CommandMenuLabel>Notifications</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/my-settings", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="my settings preferences"
				>
					<IconGear />
					<CommandMenuLabel>My Settings</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/my-settings/profile", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="my profile"
				>
					<IconCircleDottedUser />
					<CommandMenuLabel>My Profile</CommandMenuLabel>
				</CommandMenuItem>
			</CommandMenuSection>

			{/* Settings */}
			<CommandMenuSection label="Settings">
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/settings", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="general settings"
				>
					<IconGear />
					<CommandMenuLabel>General Settings</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/settings/team", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="team members"
				>
					<IconDashboard />
					<CommandMenuLabel>Team</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/settings/integrations", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="integrations"
				>
					<IconIntegration />
					<CommandMenuLabel>Integrations</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/settings/invitations", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="invitations"
				>
					<IconUsersPlus />
					<CommandMenuLabel>Invitations</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => {
						navigate({ to: "/$orgSlug/settings/debug", params: { orgSlug: orgSlug! } })
						onClose()
					}}
					textValue="debug"
				>
					<IconServers />
					<CommandMenuLabel>Debug</CommandMenuLabel>
				</CommandMenuItem>
			</CommandMenuSection>

			{/* Preferences */}
			<CommandMenuSection label="Preferences">
				<CommandMenuItem onAction={() => navigateToPage("status")} textValue="set status presence">
					<IconCircleDottedUser />
					<CommandMenuLabel>Set status...</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					onAction={() => navigateToPage("appearance")}
					textValue="appearance theme dark light mode"
				>
					<IconGear />
					<CommandMenuLabel>Change appearance...</CommandMenuLabel>
				</CommandMenuItem>
			</CommandMenuSection>
		</>
	)
}

function ChannelsView({ onClose }: { onClose: () => void }) {
	const { organizationId, slug: orgSlug } = useOrganization()
	const { user } = useAuth()
	const navigate = useNavigate()

	const { data: userChannels } = useLiveQuery(
		(q) =>
			organizationId && user?.id
				? q
						.from({ channel: channelCollection })
						.innerJoin({ member: channelMemberCollection }, ({ channel, member }) =>
							eq(member.channelId, channel.id),
						)
						.where((q) =>
							and(
								eq(q.channel.organizationId, organizationId),
								or(eq(q.channel.type, "public"), eq(q.channel.type, "private")),
								eq(q.member.userId, user.id),
								eq(q.member.isHidden, false),
							),
						)
						.orderBy(({ channel }) => channel.name, "asc")
				: null,
		[organizationId, user?.id],
	)

	return (
		<CommandMenuSection>
			{userChannels?.map(({ channel }) => (
				<CommandMenuItem
					key={channel.id}
					textValue={channel.name}
					onAction={() => {
						navigate({ to: "/$orgSlug/chat/$id", params: { orgSlug: orgSlug!, id: channel.id } })
						onClose()
					}}
				>
					<ChannelIcon icon={channel.icon} />
					<CommandMenuLabel>{channel.name}</CommandMenuLabel>
				</CommandMenuItem>
			))}
		</CommandMenuSection>
	)
}

function MembersView({ onClose }: { onClose: () => void }) {
	const { organizationId, slug: orgSlug } = useOrganization()
	const { user: currentUser } = useAuth()
	const navigate = useNavigate()

	const createDmChannel = useAtomSet(createDmChannelMutation, {
		mode: "promiseExit",
	})

	const { data: members } = useLiveQuery(
		(q) =>
			organizationId
				? q
						.from({ member: organizationMemberCollection })
						.innerJoin({ user: userCollection }, ({ member, user }) => eq(member.userId, user.id))
						.leftJoin({ presence: userPresenceStatusCollection }, ({ user, presence }) =>
							eq(user.id, presence.userId),
						)
						.where((q) => eq(q.member.organizationId, organizationId))
						.where(({ user }) => eq(user.userType, "user"))
						.orderBy(({ user }) => user.firstName, "asc")
						.select(({ member, user, presence }) => ({ member, user, presence }))
				: null,
		[organizationId],
	)

	const filteredMembers = useMemo(() => {
		return members?.filter(({ user }) => user.id !== currentUser?.id) || []
	}, [members, currentUser?.id])

	return (
		<CommandMenuSection>
			{filteredMembers.map(({ user, presence }) => {
				const fullName = `${user.firstName} ${user.lastName}`
				const isOnline =
					presence?.status === "online" ||
					presence?.status === "away" ||
					presence?.status === "busy" ||
					presence?.status === "dnd"
				return (
					<CommandMenuItem
						key={user.id}
						textValue={fullName}
						onAction={async () => {
							if (!currentUser?.id) return

							// Check if a DM channel already exists
							const existingChannel = findExistingDmChannel(currentUser.id, user.id)

							if (existingChannel) {
								// Navigate to existing channel
								navigate({
									to: "/$orgSlug/chat/$id",
									params: { orgSlug: orgSlug!, id: existingChannel.id },
								})
								onClose()
							} else {
								// Create new DM channel
								if (!organizationId || !orgSlug) return

								await toastExit(
									createDmChannel({
										payload: {
											organizationId,
											participantIds: [user.id as UserId],
											type: "single",
										},
									}),
									{
										loading: `Starting conversation with ${user.firstName}...`,
										success: (result) => {
											// Navigate to the created channel
											if (result.data.id) {
												navigate({
													to: "/$orgSlug/chat/$id",
													params: { orgSlug, id: result.data.id },
												})
											}

											onClose()
											return `Started conversation with ${user.firstName}`
										},
									},
								)
							}
						}}
					>
						<Avatar
							size="xs"
							className="mr-1"
							src={user.avatarUrl}
							alt={fullName}
							status={isOnline ? "online" : "offline"}
						/>
						<CommandMenuLabel>{fullName}</CommandMenuLabel>
						{presence?.customMessage && (
							<span className="ml-auto truncate text-muted text-xs">
								{presence.customMessage}
							</span>
						)}
					</CommandMenuItem>
				)
			})}
		</CommandMenuSection>
	)
}

type PresenceStatus = "online" | "away" | "busy" | "dnd"

const STATUS_OPTIONS: { value: PresenceStatus; label: string; color: string; description: string }[] = [
	{ value: "online", label: "Online", color: "bg-success", description: "Available and active" },
	{ value: "away", label: "Away", color: "bg-warning", description: "Stepped away temporarily" },
	{ value: "busy", label: "Busy", color: "bg-warning", description: "Focused, limit interruptions" },
	{ value: "dnd", label: "Do Not Disturb", color: "bg-danger", description: "No notifications" },
]

function StatusView({ onClose }: { onClose: () => void }) {
	const { status, setStatus } = usePresence()

	const handleStatusSelect = async (newStatus: PresenceStatus) => {
		await setStatus(newStatus)
		onClose()
	}

	return (
		<CommandMenuSection label="Set Status">
			{STATUS_OPTIONS.map((option) => (
				<CommandMenuItem
					key={option.value}
					textValue={`${option.label} ${option.description}`}
					onAction={() => handleStatusSelect(option.value)}
				>
					<span className={cn("size-3 shrink-0 rounded-full", option.color)} data-slot="icon" />
					<CommandMenuLabel>
						{option.label}
						{status === option.value && (
							<span className="ml-2 text-muted-fg text-xs">(current)</span>
						)}
					</CommandMenuLabel>
				</CommandMenuItem>
			))}
		</CommandMenuSection>
	)
}

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
	{
		value: "system",
		label: "System",
		icon: (
			<div className="flex size-4 overflow-hidden rounded-sm" data-slot="icon">
				<div className="w-1/2 bg-white" />
				<div className="w-1/2 bg-zinc-900" />
			</div>
		),
	},
	{
		value: "light",
		label: "Light",
		icon: <div className="size-4 rounded-sm border border-zinc-200 bg-white" data-slot="icon" />,
	},
	{
		value: "dark",
		label: "Dark",
		icon: <div className="size-4 rounded-sm border border-zinc-700 bg-zinc-900" data-slot="icon" />,
	},
]

const COLOR_SWATCHES = [
	{ hex: "#535862", name: "gray" },
	{ hex: "#099250", name: "green" },
	{ hex: "#1570EF", name: "blue" },
	{ hex: "#444CE7", name: "indigo" },
	{ hex: "#6938EF", name: "purple" },
	{ hex: "#BA24D5", name: "fuchsia" },
	{ hex: "#DD2590", name: "pink" },
	{ hex: "#E04F16", name: "orange" },
]

function AppearanceView({ onClose }: { onClose: () => void }) {
	const { theme, setTheme, brandColor, setBrandColor } = useTheme()

	const handleThemeSelect = (newTheme: Theme) => {
		setTheme(newTheme)
		onClose()
	}

	const handleColorSelect = (hex: string) => {
		setBrandColor(hex)
		onClose()
	}

	return (
		<>
			<CommandMenuSection label="Theme">
				{THEME_OPTIONS.map((option) => (
					<CommandMenuItem
						key={option.value}
						textValue={`${option.label} theme mode`}
						onAction={() => handleThemeSelect(option.value)}
					>
						{option.icon}
						<CommandMenuLabel>
							{option.label}
							{theme === option.value && (
								<span className="ml-2 text-muted-fg text-xs">(current)</span>
							)}
						</CommandMenuLabel>
					</CommandMenuItem>
				))}
			</CommandMenuSection>

			<CommandMenuSection label="Accent Color">
				<div className="col-span-full flex gap-2 px-2 py-1.5">
					{COLOR_SWATCHES.map((swatch) => (
						<button
							key={swatch.hex}
							type="button"
							onClick={() => handleColorSelect(swatch.hex)}
							className={cn(
								"size-6 cursor-pointer rounded-full outline-1 outline-black/10 -outline-offset-1 transition-all hover:scale-110",
								brandColor === swatch.hex && "ring-2 ring-ring ring-offset-2 ring-offset-bg",
							)}
						>
							<ColorSwatch color={swatch.hex} className="size-full rounded-full" />
						</button>
					))}
				</div>
			</CommandMenuSection>
		</>
	)
}

const channelSchema = type({
	name: "string > 2",
	type: "'public'|'private'",
})

function CreateChannelView({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
	const { user } = useAuth()
	const { organizationId, slug } = useOrganization()
	const navigate = useNavigate()
	const [channelType, setChannelType] = useState<"public" | "private">("public")
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const createChannel = useAtomSet(createChannelAction, {
		mode: "promiseExit",
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validate
		const result = channelSchema({ name, type: channelType })
		if (result instanceof type.errors) {
			setError("Channel name must be at least 3 characters")
			return
		}

		if (!user?.id || !organizationId || !slug) return

		setIsSubmitting(true)
		setError(null)

		const exit = await toastExit(
			createChannel({
				name,
				icon: null,
				type: channelType,
				organizationId,
				parentChannelId: null,
				currentUserId: user.id,
			}),
			{
				loading: "Creating channel...",
				success: (result) => {
					navigate({
						to: "/$orgSlug/chat/$id",
						params: {
							orgSlug: slug,
							id: result.data.channelId,
						},
					})
					onClose()
					return "Channel created successfully"
				},
			},
		)

		setIsSubmitting(false)
	}

	return (
		<CommandMenuFormContainer>
			<CommandMenuFormHeader
				title="Create Channel"
				subtitle="Create a new channel for your team"
				onBack={onBack}
			/>
			<form onSubmit={handleSubmit}>
				<CommandMenuFormBody className="space-y-4">
					<CommandMenuFormField label="Channel name" error={error || undefined}>
						<CommandMenuInput
							placeholder="e.g. general, design, marketing"
							value={name}
							onChange={(e) => {
								setName(e.target.value)
								setError(null)
							}}
							autoFocus
						/>
					</CommandMenuFormField>

					<CommandMenuFormField label="Channel type">
						<CommandMenuToggle
							value={channelType}
							onChange={(v) => setChannelType(v as "public" | "private")}
							options={[
								{
									value: "public",
									label: "Public",
									icon: <IconHashtag className="size-4" />,
								},
								{
									value: "private",
									label: "Private",
									icon: <IconLock className="size-4" />,
								},
							]}
						/>
					</CommandMenuFormField>
				</CommandMenuFormBody>

				<CommandMenuFormFooter>
					<span>
						<kbd>Tab</kbd> to switch fields
					</span>
					<Button
						size="xs"
						intent="primary"
						type="submit"
						isDisabled={!name.trim() || isSubmitting}
					>
						{isSubmitting ? "Creating..." : "Create"}
						{!isSubmitting && <kbd>↵</kbd>}
					</Button>
				</CommandMenuFormFooter>
			</form>
		</CommandMenuFormContainer>
	)
}

function JoinChannelView({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
	const { organizationId } = useOrganization()
	const { user } = useAuth()
	const [searchQuery, setSearchQuery] = useState("")

	const joinChannel = useAtomSet(joinChannelAction, { mode: "promiseExit" })

	// Get all channels the user is already a member of
	const { data: userChannels } = useLiveQuery(
		(q) =>
			q
				.from({ m: channelMemberCollection })
				.where(({ m }) => eq(m.userId, user?.id || ""))
				.select(({ m }) => ({ channelId: m.channelId })),
		[user?.id],
	)

	// Get all channels the user hasn't joined yet
	const { data: unjoinedChannels } = useLiveQuery(
		(q) => {
			const userChannelIds = userChannels?.map((m) => m.channelId) || []

			if (userChannelIds.length === 0) {
				return q
					.from({ channel: channelCollection })
					.where(({ channel }) => or(eq(channel.type, "public"), eq(channel.type, "private")))
					.where(({ channel }) => eq(channel.organizationId, organizationId || ""))
					.select(({ channel }) => ({ ...channel }))
			}

			return q
				.from({ channel: channelCollection })
				.where(({ channel }) => not(inArray(channel.id, userChannelIds)))
				.where(({ channel }) => or(eq(channel.type, "public"), eq(channel.type, "private")))
				.where(({ channel }) => eq(channel.organizationId, organizationId || ""))
				.select(({ channel }) => ({ ...channel }))
		},
		[user?.id, userChannels, organizationId],
	)

	const filteredChannels = useMemo(() => {
		if (!unjoinedChannels) return []
		if (!searchQuery.trim()) return unjoinedChannels
		return unjoinedChannels.filter((channel) =>
			channel.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
	}, [unjoinedChannels, searchQuery])

	const handleJoinChannel = async (channelId: ChannelId) => {
		if (!user?.id) {
			toast.error("User not authenticated")
			return
		}

		const exit = await joinChannel({
			channelId,
			userId: user.id as UserId,
		})

		matchExitWithToast(exit, {
			onSuccess: () => {
				onClose()
			},
			successMessage: "Successfully joined channel",
			customErrors: {
				ChannelNotFoundError: () => ({
					title: "Channel not found",
					description: "This channel may have been deleted.",
					isRetryable: false,
				}),
			},
		})
	}

	return (
		<CommandMenuFormContainer>
			<CommandMenuFormHeader
				title="Join Channel"
				subtitle="Browse and join available channels"
				onBack={onBack}
			/>
			<CommandMenuFormBody className="p-0">
				<div className="border-b px-3 py-2 sm:px-2.5">
					<CommandMenuInput
						placeholder="Search channels..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						autoFocus
					/>
				</div>
				<div className="max-h-64 overflow-y-auto p-2">
					{!unjoinedChannels?.length ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<IconHashtag className="mb-3 size-8 text-muted-fg" />
							<p className="text-muted-fg text-sm">You've joined all available channels</p>
						</div>
					) : filteredChannels.length === 0 ? (
						<div className="py-4 text-center text-muted-fg text-sm">
							No channels match your search
						</div>
					) : (
						<div className="space-y-1">
							{filteredChannels.map((channel) => (
								<button
									key={channel.id}
									type="button"
									onClick={() => handleJoinChannel(channel.id)}
									className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
								>
									<ChannelIcon icon={channel.icon} className="size-4 text-muted-fg" />
									<span className="flex-1 truncate">{channel.name}</span>
									<span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
										Join
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			</CommandMenuFormBody>
		</CommandMenuFormContainer>
	)
}
