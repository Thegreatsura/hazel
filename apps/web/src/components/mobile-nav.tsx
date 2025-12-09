"use client"

import { Link, useLocation, useParams } from "@tanstack/react-router"
import { twMerge } from "tailwind-merge"
import IconBell from "~/components/icons/icon-bell"
import IconDashboard from "~/components/icons/icon-dashboard"
import IconGear from "~/components/icons/icon-gear"
import IconMsgs from "~/components/icons/icon-msgs"
import { useSidebar } from "~/components/ui/sidebar"
import { IconMenu } from "./icons/icon-menu"

interface NavItem {
	id: string
	icon: React.ReactNode
	label: string
	href?: string
	action?: () => void
}

export function MobileNav() {
	const { isMobile, setIsOpenOnMobile } = useSidebar()
	const params = useParams({ strict: false }) as { orgSlug?: string }
	const location = useLocation()
	const orgSlug = params.orgSlug || ""

	if (!isMobile || !orgSlug) return null

	const isActive = (path: string) => {
		if (path === `/${orgSlug}`) {
			return location.pathname === `/${orgSlug}`
		}
		return location.pathname.startsWith(path)
	}

	const navItems: NavItem[] = [
		{
			id: "menu",
			icon: <IconMenu className="size-6" />,
			label: "Menu",
			action: () => setIsOpenOnMobile(true),
		},
		{
			id: "home",
			icon: <IconDashboard className="size-6" />,
			label: "Home",
			href: `/${orgSlug}`,
		},
		{
			id: "chat",
			icon: <IconMsgs className="size-6" />,
			label: "Messages",
			href: `/${orgSlug}/chat`,
		},
		{
			id: "notifications",
			icon: <IconBell className="size-6" />,
			label: "Activity",
			href: `/${orgSlug}/notifications`,
		},
		{
			id: "settings",
			icon: <IconGear className="size-6" />,
			label: "Settings",
			href: `/${orgSlug}/settings`,
		},
	]

	return (
		<nav className="fixed inset-x-0 bottom-0 z-50 border-sidebar-border border-t bg-sidebar/95 backdrop-blur-lg md:hidden">
			<div className="flex h-16 items-center justify-around px-2">
				{navItems.map((item) => {
					const active = item.href ? isActive(item.href) : false

					if (item.action) {
						return (
							<button
								type="button"
								key={item.id}
								onClick={item.action}
								className={twMerge(
									"flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors",
									"text-muted-fg hover:text-fg",
								)}
							>
								{item.icon}
								<span className="font-medium text-[10px]">{item.label}</span>
							</button>
						)
					}

					return (
						<Link
							key={item.id}
							to={item.href!}
							className={twMerge(
								"flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors",
								active ? "text-primary" : "text-muted-fg hover:text-fg",
							)}
						>
							{item.icon}
							<span className="font-medium text-[10px]">{item.label}</span>
						</Link>
					)
				})}
			</div>
			<div className="h-safe-area-inset-bottom bg-sidebar" />
		</nav>
	)
}
