import { ChannelsSidebar } from "~/components/channels-sidebar"
import { NavSidebar } from "~/components/nav-sidebar"
import { Sidebar } from "~/components/ui/sidebar"

export function AppSidebar() {
	return (
		<Sidebar
			closeButton={false}
			collapsible="dock"
			className="overflow-hidden *:data-[sidebar=default]:flex-row"
		>
			<NavSidebar />

			<ChannelsSidebar />
		</Sidebar>
	)
}
