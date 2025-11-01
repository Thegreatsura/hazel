"use client"

import type { OrganizationId } from "@hazel/db/schema"
import {
	AdjustmentsHorizontalIcon,
	ArrowRightEndOnRectangleIcon,
	ArrowRightStartOnRectangleIcon,
	CalendarDaysIcon,
	ChartPieIcon,
	ChatBubbleLeftRightIcon,
	ChatBubbleOvalLeftEllipsisIcon,
	ChevronUpDownIcon,
	Cog6ToothIcon,
	DocumentTextIcon,
	ExclamationTriangleIcon,
	FaceSmileIcon,
	FolderPlusIcon,
	MagnifyingGlassIcon,
	MegaphoneIcon,
	PlusCircleIcon,
	PlusIcon,
	ShieldCheckIcon,
	SpeakerWaveIcon,
	UserGroupIcon,
	UserPlusIcon,
	UsersIcon,
	WrenchScrewdriverIcon,
} from "@heroicons/react/20/solid"
import { and, eq, or, useLiveQuery } from "@tanstack/react-db"
import { useMemo, useState } from "react"
import type { Selection } from "react-aria-components"
import { Button as PrimitiveButton } from "react-aria-components"
import { twJoin } from "tailwind-merge"
import { servers } from "~/components/nav-sidebar"
import { Avatar } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"

import { Keyboard } from "~/components/ui/keyboard"
import {
	Menu,
	MenuContent,
	MenuHeader,
	MenuItem,
	MenuLabel,
	MenuSection,
	MenuSeparator,
	MenuTrigger,
} from "~/components/ui/menu"
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from "~/components/ui/modal"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
	SidebarLabel,
	SidebarSection,
	SidebarSectionGroup,
	useSidebar,
} from "~/components/ui/sidebar"
import { Strong } from "~/components/ui/text"
import { channelCollection, channelMemberCollection } from "~/db/collections"
import { useOrganization } from "~/hooks/use-organization"
import { useAuth } from "~/lib/auth"

const ChannelGroup = (props: { organizationId: OrganizationId }) => {
	const { user } = useAuth()

	const { data: userChannels } = useLiveQuery(
		(q) =>
			q
				.from({ channel: channelCollection })
				.innerJoin({ member: channelMemberCollection }, ({ channel, member }) =>
					eq(member.channelId, channel.id),
				)
				.where((q) =>
					and(
						eq(q.channel.organizationId, props.organizationId),
						or(eq(q.channel.type, "public"), eq(q.channel.type, "private")),
						eq(q.member.userId, user?.id || ""),
						eq(q.member.isHidden, false),
						eq(q.member.isFavorite, false),
					),
				)
				.orderBy(({ channel }) => channel.createdAt, "asc"),
		[user?.id, props.organizationId],
	)

	const channels = useMemo(() => {
		if (!userChannels) return []
		return userChannels.map((row) => row.channel)
	}, [userChannels])

	return (
		<SidebarSection label="Channels">
			<div className="col-span-full flex items-center justify-between gap-x-2 pl-2.5 text-muted-fg text-xs/5">
				<Strong>Channels</Strong>
				<Button intent="plain" isCircle size="sq-sm">
					<PlusIcon />
				</Button>
			</div>
			{channels.map((channel) => (
				<SidebarItem key={channel.id} href={`#/chat/${channel.id}`} tooltip={channel.name}>
					<ChatBubbleOvalLeftEllipsisIcon />
					<SidebarLabel>{channel.name}</SidebarLabel>
				</SidebarItem>
			))}
		</SidebarSection>
	)
}

const DmChannelGroup = (props: { organizationId: OrganizationId }) => {
	const { user } = useAuth()

	const { data: userDmChannels } = useLiveQuery(
		(q) =>
			q
				.from({ channel: channelCollection })
				.innerJoin({ member: channelMemberCollection }, ({ channel, member }) =>
					eq(member.channelId, channel.id),
				)
				.where((q) =>
					and(
						eq(q.channel.organizationId, props.organizationId),
						or(eq(q.channel.type, "direct"), eq(q.channel.type, "single")),
						eq(q.member.userId, user?.id || ""),
						eq(q.member.isHidden, false),
						eq(q.member.isFavorite, false),
					),
				)
				.orderBy(({ channel }) => channel.createdAt, "asc"),
		[user?.id, props.organizationId],
	)

	const dmChannels = useMemo(() => {
		if (!userDmChannels) return []
		return userDmChannels.map((row) => row.channel)
	}, [userDmChannels])

	return (
		<SidebarSection label="Direct Messages">
			<div className="col-span-full flex items-center justify-between gap-x-2 pl-2.5 text-muted-fg text-xs/5">
				<Strong>Direct Messages</Strong>
				<Button intent="plain" isCircle size="sq-sm">
					<PlusIcon />
				</Button>
			</div>
			{dmChannels.map((channel) => (
				<SidebarItem key={channel.id} href={`#/chat/${channel.id}`} tooltip={channel.name}>
					<ChatBubbleLeftRightIcon />
					<SidebarLabel>{channel.name}</SidebarLabel>
				</SidebarItem>
			))}
		</SidebarSection>
	)
}

export function ChannelsSidebar() {
	const [isSelected, setIsSelected] = useState<Selection>(new Set([servers[1].id]))
	const { isMobile } = useSidebar()
	const currentServer = [...isSelected][0]
	const { organizationId } = useOrganization()
	return (
		<Sidebar collapsible="none" className="flex flex-1">
			<SidebarHeader className="border-b py-4">
				<Menu>
					<PrimitiveButton className="relative flex items-center justify-between gap-x-2 font-semibold outline-hidden focus-visible:ring focus-visible:ring-primary">
						<div className="flex w-full items-center gap-1">
							<span className="flex gap-x-2 font-medium text-sm/6">
								<Avatar
									isSquare
									size="sm"
									src={servers.find((i) => i.id === currentServer)?.avatar}
								/>
								{servers.find((i) => i.id === currentServer)?.name}
							</span>
							<ChevronUpDownIcon className="ml-auto size-4 text-muted-fg" />
						</div>
					</PrimitiveButton>
					<MenuContent className="min-w-(--trigger-width)">
						{isMobile ? (
							<MenuSection
								items={servers}
								disallowEmptySelection
								selectionMode="single"
								selectedKeys={isSelected}
								onSelectionChange={setIsSelected}
							>
								{(server) => (
									<MenuItem id={server.id} textValue={server.name}>
										<Avatar src={server.avatar} alt={server.name} />
										<SidebarLabel>{server.name}</SidebarLabel>
									</MenuItem>
								)}
							</MenuSection>
						) : (
							<>
								<MenuSection>
									<MenuItem href="#">
										<UserPlusIcon />
										<MenuLabel>Invite people</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<UserGroupIcon />
										<MenuLabel>Manage members</MenuLabel>
									</MenuItem>
								</MenuSection>

								<MenuSeparator />

								<MenuSection>
									<MenuItem href="#">
										<PlusCircleIcon />
										<MenuLabel>Create channel</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<FolderPlusIcon />
										<MenuLabel>Create category</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<CalendarDaysIcon />
										<MenuLabel>Create event</MenuLabel>
									</MenuItem>
								</MenuSection>

								<MenuSeparator />

								<MenuSection>
									<MenuItem href="#">
										<Cog6ToothIcon />
										<MenuLabel>Server settings</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<ShieldCheckIcon />
										<MenuLabel>Roles & permissions</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<AdjustmentsHorizontalIcon />
										<MenuLabel>Notification settings</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<FaceSmileIcon />
										<MenuLabel>Custom emojis</MenuLabel>
									</MenuItem>
									<MenuItem href="#">
										<WrenchScrewdriverIcon />
										<MenuLabel>Integrations</MenuLabel>
									</MenuItem>
								</MenuSection>

								<MenuSeparator />

								<MenuSection>
									<MenuItem href="#">
										<ExclamationTriangleIcon />
										<MenuLabel>Report server</MenuLabel>
									</MenuItem>
									<MenuItem intent="danger" href="#">
										<ArrowRightEndOnRectangleIcon />
										<MenuLabel>Leave server</MenuLabel>
									</MenuItem>
								</MenuSection>
							</>
						)}
					</MenuContent>
				</Menu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarSectionGroup>
					<SidebarSection aria-label="Goto">
						<SidebarItem href="#">
							<CalendarDaysIcon />
							<SidebarLabel>Events</SidebarLabel>
						</SidebarItem>
						<SidebarItem>
							<MagnifyingGlassIcon />
							<SidebarLabel>Browse channels</SidebarLabel>
							<Keyboard className="-translate-y-1/2 absolute top-1/2 right-2 font-mono text-muted-fg text-xs">
								⌘K
							</Keyboard>
						</SidebarItem>
						<SidebarItem href="#">
							<UsersIcon />
							<SidebarLabel>Members</SidebarLabel>
						</SidebarItem>
					</SidebarSection>
					<SidebarSection label="Information">
						<SidebarItem href="#">
							<MegaphoneIcon />
							<SidebarLabel>Announcements</SidebarLabel>
						</SidebarItem>
						<SidebarItem href="#">
							<DocumentTextIcon />
							<SidebarLabel>Rules</SidebarLabel>
						</SidebarItem>
					</SidebarSection>
					{organizationId && (
						<>
							<ChannelGroup organizationId={organizationId} />
							<DmChannelGroup organizationId={organizationId} />
						</>
					)}
				</SidebarSectionGroup>
			</SidebarContent>
			<SidebarFooter className="flex flex-row justify-between gap-4 group-data-[state=collapsed]:flex-col">
				<Menu>
					<MenuTrigger
						className="flex w-full items-center justify-between rounded-lg border bg-accent/20 px-2 py-1 hover:bg-accent/50"
						aria-label="Profile"
					>
						<div className="flex items-center gap-x-2">
							<Avatar
								className={twJoin([
									"[--avatar-radius:7%] group-data-[state=collapsed]:size-6 group-data-[state=collapsed]:*:size-6",
									"size-8 *:size-8",
								])}
								isSquare
								src="https://design.intentui.com/images/blocks/avatar/woman.webp"
							/>

							<div className="in-data-[collapsible=dock]:hidden text-sm">
								<SidebarLabel>Poppy Ellsworth</SidebarLabel>
								<span className="-mt-0.5 block text-muted-fg">ellsworth@domain.com</span>
							</div>
						</div>
						<ChevronUpDownIcon data-slot="chevron" className="size-4" />
					</MenuTrigger>
					<MenuContent
						className="in-data-[collapsible=collapsed]:min-w-56 min-w-(--trigger-width)"
						placement="bottom right"
					>
						<MenuSection>
							<MenuHeader separator>
								<span className="block">Poppy Ellsworth</span>
								<span className="font-normal text-muted-fg">ellsworth@domain.com</span>
							</MenuHeader>
						</MenuSection>

						<MenuItem href="#dashboard">
							<ChartPieIcon />
							<MenuLabel>Dashboard</MenuLabel>
						</MenuItem>
						<MenuItem href="#settings">
							<Cog6ToothIcon />
							<MenuLabel>Settings</MenuLabel>
						</MenuItem>
						<MenuItem href="#security">
							<ShieldCheckIcon />
							<MenuLabel>Security</MenuLabel>
						</MenuItem>
						<MenuSeparator />

						<MenuItem href="#contact">
							<ChatBubbleLeftRightIcon />
							<MenuLabel>Customer support</MenuLabel>
						</MenuItem>
						<MenuSeparator />
						<MenuItem href="#logout">
							<ArrowRightStartOnRectangleIcon />
							<MenuLabel>Log out</MenuLabel>
						</MenuItem>
					</MenuContent>
				</Menu>
			</SidebarFooter>
		</Sidebar>
	)
}
