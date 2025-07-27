import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/solid-query"
import { createFileRoute } from "@tanstack/solid-router"
import { createSignal, For, Show, Suspense } from "solid-js"
import {
	IconChatStroke,
	IconSearchStroke,
	IconSpinnerStroke,
	IconThreeDotsMenuHorizontalStroke,
} from "~/components/iconsv2"
import { Avatar } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { TextField } from "~/components/ui/text-field"
import { createMutation } from "~/lib/convex"
import { convexQuery } from "~/lib/convex-query"

export const Route = createFileRoute("/_protected/_app/app/")({
	component: RouteComponent,
})

function RouteComponent() {
	const navigate = Route.useNavigate()

	const [searchQuery, setSearchQuery] = createSignal("")

	const membersQuery = useQuery(() => convexQuery(api.social.getMembersForOrganization, {}))

	const currentUserQuery = useQuery(() => convexQuery(api.me.get, {}))

	const createDmChannel = createMutation(api.channels.createDmChannel)

	const handleOpenChat = async ({ targetUserId }: { targetUserId: Id<"users"> }) => {
		if (!targetUserId) {
			return
		}

		const channelId = await createDmChannel({
			userId: targetUserId,
		})

		navigate({ to: "/app/chat/$id", params: { id: channelId } })
	}

	return (
		<div class="container mx-auto px-6 py-12">
			<div class="flex flex-col gap-2">
				<TextField
					value={searchQuery()}
					onInput={(props) => {
						setSearchQuery(props.target.value)
					}}
					prefix={<IconSearchStroke class="ml-3 size-5" />}
					placeholder="Search Members"
				/>
				<Suspense
					fallback={
						<div>
							<IconSpinnerStroke class="animate-spin" />
						</div>
					}
				>
					<For each={membersQuery.data}>
						{(member) => (
							<div class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
								<div class="flex items-center gap-2">
									<Avatar src={member.avatarUrl} name={member.displayName} />

									<div>
										<p>{member.displayName}</p>
										<p class="text-muted-foreground">{member.tag}</p>
									</div>
								</div>
								<Show when={currentUserQuery.data?._id !== member.accountId}>
									<div class="flex items-center gap-2">
										<Button
											intent="ghost"
											size="square"
											onClick={() =>
												handleOpenChat({
													targetUserId: member._id,
												})
											}
										>
											<IconChatStroke />
										</Button>
										<Button intent="ghost" size="square">
											<IconThreeDotsMenuHorizontalStroke />
										</Button>
									</div>
								</Show>
							</div>
						)}
					</For>
				</Suspense>
			</div>
		</div>
	)
}
