import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { type } from "arktype"
import { useAuth } from "authkit-solidjs"
import { createEffect } from "solid-js"
import { useConvexAuth } from "~/lib/convex/convex-auth-state"

export const Route = createFileRoute("/_auth/sign-in")({
	component: RouteComponent,
	validateSearch: type({
		"redirectTo?": "string",
	}),
})

function RouteComponent() {
	const navigate = useNavigate()
	const { signIn } = useAuth()

	const { isAuthenticated } = useConvexAuth()

	createEffect(() => {
		signIn({})
	})

	createEffect(() => {
		if (isAuthenticated()) {
			navigate({ to: "/" })
		}
	})

	return <></>
}
