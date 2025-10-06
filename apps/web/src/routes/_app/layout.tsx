import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router"
import { organizationCollection, organizationMemberCollection } from "~/db/collections"
import { useAuth } from "~/providers/auth-provider"

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
	loader: async () => {
		await organizationCollection.preload()
		await organizationMemberCollection.preload()

		return null
	},
})

function RouteComponent() {
	const { user, isLoading } = useAuth()
	return (
		<>
			{!user && !isLoading && (
				<Navigate
					to="/auth/login"
					search={{
						returnTo: location.pathname,
					}}
				/>
			)}
			<Outlet />
		</>
	)
}
