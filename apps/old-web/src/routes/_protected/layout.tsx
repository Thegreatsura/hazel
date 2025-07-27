import { createFileRoute, Navigate, Outlet } from "@tanstack/solid-router"
import { useAuth } from "authkit-solidjs"
import { createMemo, Match, Switch } from "solid-js"
import { useConvexAuth } from "~/lib/convex/convex-auth-state"

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
})

function RouteComponent() {
	const { isLoading, isAuthenticated } = useConvexAuth()

	const auth = useAuth()

	createMemo(() => {
		console.log("useAuth:", auth.isLoading, !!auth.user)
		console.log("useConvexAuth:", isLoading(), isAuthenticated())
	})

	return (
		<Switch>
			<Match when={!isAuthenticated() && !isLoading()}>XD</Match>

			<Match when={isAuthenticated() && !isLoading()}>
				<Outlet />
			</Match>
		</Switch>
	)
}
