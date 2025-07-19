import { createFileRoute } from "@tanstack/react-router"

import "@radix-ui/themes/styles.css"
import "@workos-inc/widgets/styles.css"

import { useAuth } from "@workos-inc/authkit-react"
import {
	OrganizationSwitcher,
	UserProfile,
	UserSecurity,
	UserSessions,
	UsersManagement,
	WorkOsWidgets,
} from "@workos-inc/widgets"

export const Route = createFileRoute("/test")({
	component: RouteComponent,
})

function RouteComponent() {
	const { isLoading, user, getAccessToken } = useAuth()
	if (isLoading) {
		return "..."
	}
	if (!user) {
		return "Logged in user is required"
	}

	return <UsersTable />
}

function UsersTable() {
	const { getAccessToken, switchToOrganization } = useAuth()

	return (
		<WorkOsWidgets
			theme={{
				appearance: "dark",
				accentColor: "green",
				radius: "medium",
				fontFamily: "Inter",
			}}
		>
			<OrganizationSwitcher authToken={getAccessToken} switchToOrganization={switchToOrganization}>
				{/* <CreateOrganization /> */}
			</OrganizationSwitcher>
			<UserProfile authToken={getAccessToken} />

			<UsersManagement authToken={getAccessToken} />
			<UserSessions authToken={getAccessToken} />
			<UserSecurity authToken={getAccessToken} />
		</WorkOsWidgets>
	)
}
