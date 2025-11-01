import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useState } from "react"
import { AppSidebar } from "~/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import {
	attachmentCollection,
	channelCollection,
	channelMemberCollection,
	directMessageParticipantCollection,
	organizationCollection,
	organizationMemberCollection,
} from "~/db/collections"

export const Route = createFileRoute("/_app/$orgSlug")({
	component: RouteComponent,
	loader: async () => {
		// TODO: Should be scoped to the organization
		await channelCollection.preload()
		await channelMemberCollection.preload()
		await attachmentCollection.preload()
		await directMessageParticipantCollection.preload()

		await organizationCollection.preload()
		await organizationMemberCollection.preload()

		return null
	},
})

function RouteComponent() {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "350px",
				} as React.CSSProperties
			}
		>
			<AppSidebar />
			<SidebarInset>{/* <Outlet /> */}</SidebarInset>
		</SidebarProvider>
	)
}
