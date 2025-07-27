import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router"
import { Authenticated, Unauthenticated } from "convex/react"
import { AppSidebar } from "~/components/app-sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"

export const Route = createFileRoute("/app")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<>
			<Authenticated>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>
						<Outlet />
					</SidebarInset>
				</SidebarProvider>
			</Authenticated>
			<Unauthenticated>
				<Navigate
					to="/auth/login"
					search={{
						returnTo: location.pathname,
					}}
				/>
			</Unauthenticated>
		</>
	)
}
