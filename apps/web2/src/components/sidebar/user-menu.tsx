import {
	ArrowRightStartOnRectangleIcon,
	ChartPieIcon,
	ChatBubbleLeftRightIcon,
	ChevronUpDownIcon,
	Cog6ToothIcon,
	ShieldCheckIcon,
} from "@heroicons/react/20/solid"
import { twJoin } from "tailwind-merge"
import { Avatar } from "~/components/ui/avatar"
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
import { SidebarLabel } from "~/components/ui/sidebar"
import { useAuth } from "~/lib/auth"

export function UserMenu() {
	const { user, logout } = useAuth()

	// Fallbacks for missing user data
	const displayName =
		user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "User"
	const avatarUrl = user?.avatarUrl || undefined

	return (
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
						src={avatarUrl}
					/>

					<div className="in-data-[collapsible=dock]:hidden text-sm">
						<SidebarLabel>{displayName}</SidebarLabel>
						{user?.email && <span className="-mt-0.5 block text-muted-fg">{user.email}</span>}
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
						<span className="block">{displayName}</span>
						{user?.email && <span className="font-normal text-muted-fg">{user.email}</span>}
					</MenuHeader>
				</MenuSection>

				<MenuItem href="#dashboard">
					<ChartPieIcon />
					<MenuLabel>Dashboard</MenuLabel>
				</MenuItem>
				<MenuItem href="/settings">
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
				<MenuItem onAction={() => logout()}>
					<ArrowRightStartOnRectangleIcon />
					<MenuLabel>Log out</MenuLabel>
				</MenuItem>
			</MenuContent>
		</Menu>
	)
}
