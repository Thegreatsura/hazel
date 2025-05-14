import { createQuery } from "@rocicorp/zero/solid"
import { type Accessor, createMemo } from "solid-js"
import { useZero } from "~/lib/zero/zero-context"

export const useServerChannels = (serverId: Accessor<string>) => {
	const z = useZero()

	const serverChannelQuery = createMemo(() =>
		z.query.serverChannels
			.related("users")
			.related("members")
			.where((eq) =>
				eq.and(
					eq.cmp("channelType", "!=", "direct"),
					eq.cmp("channelType", "!=", "single"),
					eq.cmp("serverId", "=", serverId()),
				),
			)
			.whereExists("users", (eq) => eq.where("id", "=", z.userID)),
	)

	const [serverChannels, status] = createQuery(serverChannelQuery)

	const isLoading = createMemo(() => status().type !== "complete")

	return { channels: serverChannels, isLoading }
}
