import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router"
import { Loader } from "~/components/loader"
import { organizationCollection, organizationMemberCollection } from "~/db/collections"
import { useAuth } from "~/lib/auth"

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
	const isRouterPending = useRouterState({ select: (s) => s.status === "pending" })
	const showLoader = isLoading || isRouterPending

	return (
		<>
			{!user && !showLoader && (
				<Navigate
					to="/auth/login"
					search={{
						returnTo: location.pathname,
					}}
				/>
			)}
			{showLoader ? <Loader /> : <Outlet />}
		</>
	)
}
