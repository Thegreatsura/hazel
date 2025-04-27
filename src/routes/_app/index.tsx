import { Splitter } from "@ark-ui/solid"
import { useQuery } from "@rocicorp/zero/solid"
import { createFileRoute } from "@tanstack/solid-router"
import { ClerkLoaded, ClerkLoading, SignInButton, SignedIn, SignedOut, UserButton, useAuth } from "clerk-solidjs"
import { For, Show } from "solid-js"
import { useCurrentUser } from "~/lib/hooks/data/use-current-user"
import { Sidebar } from "../../components/sidebar"
import { useZero } from "../../lib/zero-context"

export const Route = createFileRoute("/_app/")({
	component: App,
})

function App() {
	const z = useZero()
	console.log(z)

	const { user, isLoading } = useCurrentUser()

	return (
		<main class="flex w-full">
			<Splitter.Root panels={[{ id: "a", minSize: 15, maxSize: 20 }, { id: "b" }]}>
				<Splitter.Panel id="a">
					<Sidebar />
				</Splitter.Panel>
				<Splitter.ResizeTrigger class="h-12 w-1 bg-primary" id="a:b" aria-label="Resize" />
				<Splitter.Panel id="b">
					<Show when={!isLoading()} fallback={<p>Loading...</p>}>
						<p>Welcome, {user()?.displayName}</p>
					</Show>
					<SignedIn>
						<UserButton />
					</SignedIn>
					<SignedOut>
						<SignInButton />
					</SignedOut>
				</Splitter.Panel>
			</Splitter.Root>
		</main>
	)
}
