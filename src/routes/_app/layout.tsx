import { Outlet, createFileRoute } from "@tanstack/solid-router"

import { Suspense } from "solid-js"

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<Suspense>
			<Outlet />
		</Suspense>
	)
}
