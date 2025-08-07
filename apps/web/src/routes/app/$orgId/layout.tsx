import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "~/components/app-sidebar/app-sidebar"
import { PresenceProvider } from "~/components/presence/presence-provider"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"

export const Route = createFileRoute("/app/$orgId")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<PresenceProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<Outlet />
				</SidebarInset>
			</SidebarProvider>
		</PresenceProvider>
	)
}
