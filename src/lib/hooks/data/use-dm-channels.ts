import { useQuery } from "@rocicorp/zero/solid"
import { createMemo } from "solid-js"
import { useZero } from "~/lib/zero-context"

export const useDmChannels = (serverId: string) => {
	const z = useZero()

	const dmChannelQuery = z.query.serverChannels
		.related("users")
		.limit(10)
		.where((eq) => eq.and(eq.cmp("channelType", "=", "direct"), eq.cmp("serverId", "=", serverId)))

	const [recentDmChannels, status] = useQuery(() => dmChannelQuery)

	const isLoading = createMemo(() => status().type !== "complete")

	return { channels: recentDmChannels, isLoading }
}
