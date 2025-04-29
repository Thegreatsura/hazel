import { createFileRoute } from "@tanstack/solid-router"
import { type } from "arktype"
import { Button } from "~/components/ui/button"
import { TextField } from "~/components/ui/text-field"

const searchType = type({
	"step?": "'user' | 'server'",
})

export const Route = createFileRoute("/onboarding")({
	component: RouteComponent,
	validateSearch: searchType,
})

function RouteComponent() {
	const searchData = Route.useSearch()

	return (
		<div class="flex h-screen items-center justify-center">
			{searchData().step === "server" ? (
				<p>Server</p>
			) : (
				<form class="flex flex-col gap-2">
					<TextField prefix="amaz" suffix="XD" />
					<TextField prefix="amaz" suffix="XD" />
					<TextField prefix="amaz" suffix="XD" label="Display Name" helperText="Your display name" />

					<Button type="submit">Create Profile</Button>
				</form>
			)}
		</div>
	)
}
