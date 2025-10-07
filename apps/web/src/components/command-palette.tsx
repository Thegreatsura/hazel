"use client"

import { and, eq, or, useLiveQuery } from "@tanstack/react-db"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
	CommandMenu,
	CommandMenuItem,
	CommandMenuLabel,
	CommandMenuList,
	type CommandMenuProps,
	CommandMenuSearch,
	CommandMenuSection,
} from "~/components/ui/command-menu"
import {
	channelCollection,
	channelMemberCollection,
	organizationMemberCollection,
	userCollection,
} from "~/db/collections"
import { useOrganization } from "~/hooks/use-organization"
import { useAuth } from "~/providers/auth-provider"
import { Avatar } from "./base/avatar/avatar"
import IconBell from "./icons/icon-bell"
import IconCircleDottedUser from "./icons/icon-circle-dotted-user"
import IconDashboard from "./icons/icon-dashboard"
import IconEnvelope from "./icons/icon-envelope"
import IconGear from "./icons/icon-gear"
import IconHashtag from "./icons/icon-hashtag"
import IconIntegration from "./icons/icon-integratio-"
import IconMsgs from "./icons/icon-msgs"
import IconPhone from "./icons/icon-phone"
import IconUsersPlus from "./icons/icon-users-plus"

type Page = "home" | "channels" | "members"

export function CommandPalette(props: Pick<CommandMenuProps, "isOpen" | "onOpenChange">) {
	const [currentPage, setCurrentPage] = useState<Page>("home")
	const [pageHistory, setPageHistory] = useState<Page[]>([])
	const [inputValue, setInputValue] = useState("")

	const navigateToPage = useCallback(
		(page: Page) => {
			setPageHistory((prev) => [...prev, currentPage])
			setCurrentPage(page)
			setInputValue("") // Reset search when navigating
		},
		[currentPage],
	)

	const goBack = useCallback(() => {
		if (pageHistory.length > 0) {
			const previousPage = pageHistory[pageHistory.length - 1]
			setPageHistory((prev) => prev.slice(0, -1))
			if (previousPage) {
				setCurrentPage(previousPage)
				setInputValue("") // Reset search when going back
			}
		}
	}, [pageHistory])

	// Reset to home when modal closes/opens
	useEffect(() => {
		if (!props.isOpen) {
			setCurrentPage("home")
			setPageHistory([])
			setInputValue("")
		} else {
			// Ensure search input gets focus when modal opens
			setTimeout(() => {
				const searchInput = document.querySelector('[role="dialog"] input') as HTMLInputElement
				if (searchInput) {
					searchInput.focus()
				}
			}, 100)
		}
	}, [props.isOpen])

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
			default:
				return "Where would you like to go?"
		}
	}, [currentPage])

	return (
		<CommandMenu
			key={currentPage}
			shortcut="k"
			inputValue={inputValue}
			onInputChange={setInputValue}
			{...props}
		>
			<CommandMenuSearch placeholder={searchPlaceholder} />
			<CommandMenuList>
				{currentPage === "home" && <HomeView navigateToPage={navigateToPage} />}
				{currentPage === "channels" && <ChannelsView />}
				{currentPage === "members" && <MembersView />}
			</CommandMenuList>
		</CommandMenu>
	)
}

function HomeView({ navigateToPage }: { navigateToPage: (page: Page) => void }) {
	const { slug: orgSlug } = useOrganization()

	return (
		<>
			<CommandMenuSection>
				<CommandMenuItem onAction={() => navigateToPage("channels")} textValue="browse channels">
					<IconMsgs />
					<CommandMenuLabel>Browse channels...</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem onAction={() => navigateToPage("members")} textValue="browse members">
					<IconUsersPlus />
					<CommandMenuLabel>Browse members...</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/notifications`} textValue="notifications">
					<IconBell />
					<CommandMenuLabel>Notifications</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/call`} textValue="calls">
					<IconPhone />
					<CommandMenuLabel>Calls</CommandMenuLabel>
				</CommandMenuItem>
			</CommandMenuSection>

			<CommandMenuSection label="Settings">
				<CommandMenuItem href={`/${orgSlug}/settings`} textValue="general settings">
					<IconGear />
					<CommandMenuLabel>General Settings</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/settings/profile`} textValue="profile">
					<IconCircleDottedUser />
					<CommandMenuLabel>Profile</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/settings/team`} textValue="team">
					<IconDashboard />
					<CommandMenuLabel>Team</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/settings/billing`} textValue="billing">
					<IconDashboard />
					<CommandMenuLabel>Billing</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/settings/email`} textValue="email">
					<IconEnvelope />
					<CommandMenuLabel>Email</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/settings/integrations`} textValue="integrations">
					<IconIntegration />
					<CommandMenuLabel>Integrations</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem href={`/${orgSlug}/settings/invitations`} textValue="invitations">
					<IconUsersPlus />
					<CommandMenuLabel>Invitations</CommandMenuLabel>
				</CommandMenuItem>
				<CommandMenuItem
					href={`/${orgSlug}/settings/notifications`}
					textValue="notification settings"
				>
					<IconBell />
					<CommandMenuLabel>Notification Settings</CommandMenuLabel>
				</CommandMenuItem>
			</CommandMenuSection>
		</>
	)
}

function ChannelsView() {
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
					href={`/${orgSlug}/chat/${channel.id}`}
					textValue={channel.name}
					onAction={() => {
						navigate({ to: "/$orgSlug/chat/$id", params: { orgSlug: orgSlug!, id: channel.id } })
					}}
				>
					<IconHashtag />
					<CommandMenuLabel>{channel.name}</CommandMenuLabel>
				</CommandMenuItem>
			))}
		</CommandMenuSection>
	)
}

function MembersView() {
	const { organizationId, slug: orgSlug } = useOrganization()
	const { user: currentUser } = useAuth()
	const _navigate = useNavigate()

	const { data: members } = useLiveQuery(
		(q) =>
			organizationId
				? q
						.from({ member: organizationMemberCollection })
						.innerJoin({ user: userCollection }, ({ member, user }) => eq(member.userId, user.id))
						.where((q) => eq(q.member.organizationId, organizationId))
						.orderBy(({ user }) => user.firstName, "asc")
				: null,
		[organizationId],
	)

	const filteredMembers = useMemo(() => {
		return members?.filter(({ user }) => user.id !== currentUser?.id) || []
	}, [members, currentUser?.id])

	return (
		<CommandMenuSection>
			{filteredMembers.map(({ user }) => {
				const fullName = `${user.firstName} ${user.lastName}`
				return (
					<CommandMenuItem
						key={user.id}
						textValue={fullName}
						onAction={() => {
							// TODO: Navigate to DM or create DM with this user
							console.log("Navigate to DM with", user.id)
						}}
					>
						<Avatar size="xs" src={user.avatarUrl} alt={fullName} />
						<CommandMenuLabel>{fullName}</CommandMenuLabel>
					</CommandMenuItem>
				)
			})}
		</CommandMenuSection>
	)
}
