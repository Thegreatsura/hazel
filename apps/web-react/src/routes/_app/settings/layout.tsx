import { createFileRoute, Outlet } from "@tanstack/react-router"
import {
	BarChartSquare02,
	Folder,
	HomeLine,
	LayoutAlt01,
	MessageChatCircle,
	PieChart03,
	Rows01,
	Settings01,
} from "@untitledui/icons"
import { SidebarNavigationSectionDividers } from "@/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers"
import { BadgeWithDot } from "@/components/base/badges/badges"

export const Route = createFileRoute("/_app/settings")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="flex flex-col bg-primary lg:flex-row">
			<SidebarNavigationSectionDividers
				items={[
					{
						label: "Home",
						href: "#",
						icon: HomeLine,
					},
					{
						label: "Dashboard",
						href: "/dashboard",
						icon: BarChartSquare02,
					},
					{
						label: "Projects",
						href: "#",
						icon: Rows01,
					},
					{ divider: true },
					{
						label: "Folders",
						icon: Folder,
						items: [
							{ label: "View all", badge: 18, href: "#" },
							{ label: "Recent", badge: 8, href: "#" },
							{ label: "Favorites", badge: 6, href: "#" },
							{ label: "Shared", badge: 4, href: "#" },
						],
					},
					{ divider: true },
					{
						label: "Reporting",
						href: "#",
						icon: PieChart03,
					},
					{
						label: "Settings",
						href: "#",
						icon: Settings01,
					},
					{
						label: "Support",
						href: "#",
						icon: MessageChatCircle,
						badge: (
							<BadgeWithDot color="success" type="modern" size="sm">
								Online
							</BadgeWithDot>
						),
					},
					{
						label: "Open in browser",
						href: "https://www.untitledui.com/",
						icon: LayoutAlt01,
					},
				]}
			/>
			<Outlet />
		</div>
	)
}
