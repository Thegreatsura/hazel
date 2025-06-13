import { Outlet, createFileRoute } from "@tanstack/solid-router"
import { useConvexAuth } from "~/lib/convex/convex-auth-state"

import { RedirectToSignIn } from "clerk-solidjs"
import { Match, Switch } from "solid-js"

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
})

function RouteComponent() {
	const { isLoading, isAuthenticated } = useConvexAuth()

	return (
		<Switch>
			<Match when={!isAuthenticated() && !isLoading()}>
				<RedirectToSignIn />
			</Match>

			<Match when={isAuthenticated() && !isLoading()}>
				<Outlet />
			</Match>
		</Switch>
	)
}
