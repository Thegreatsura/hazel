import { api } from "@hazel/backend/api"
import { createFileRoute } from "@tanstack/solid-router"
import { Show, createSignal } from "solid-js"

import { IconLoader } from "~/components/icons/loader"
import { Button } from "~/components/ui/button"
import { toaster } from "~/components/ui/toaster"
import { createMutation } from "~/lib/convex"

export const Route = createFileRoute("/_protected/invite/$code")({
	component: RouteComponent,
})

function RouteComponent() {
	const params = Route.useParams()
	const navigate = Route.useNavigate()

	const acceptInvite = createMutation(api.invites.acceptInvite)

	const [status, setStatus] = createSignal<"idle" | "loading" | "error">("idle")

	return (
		<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
			<Show when={status() === "idle"}>
				<Button
					disabled={status() === "loading"}
					onClick={async () => {
						setStatus("loading")
						try {
							const serverId = await acceptInvite({ code: params().code })
							navigate({ to: "/$serverId" as const, params: { serverId } })
						} catch (err) {
							console.error(err)
							toaster.error({ title: "Failed to join", type: "error" })
							setStatus("error")
						}
					}}
				>
					Join Server
				</Button>
			</Show>

			<Show when={status() === "loading"}>
				<IconLoader class="size-6 animate-spin" />
				<p>Joining...</p>
			</Show>

			<Show when={status() === "error"}>
				<p class="text-destructive">Failed to accept invite.</p>
				<Button onClick={() => navigate({ to: "/" })}>Go Home</Button>
			</Show>
		</div>
	)
}
