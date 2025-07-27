import type { QueryClient } from "@tanstack/solid-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/solid-router"
import type { Client } from "authkit-solidjs"

import type { ConvexSolidClient } from "~/lib/convex"

interface RootContext {
	convex: ConvexSolidClient
	queryClient: QueryClient
	authClient: Client
}

export const Route = createRootRouteWithContext<RootContext>()({
	component: RootComponent,
})

function RootComponent() {
	return <Outlet />
}
