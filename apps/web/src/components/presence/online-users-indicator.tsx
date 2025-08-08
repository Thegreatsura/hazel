import { convexQuery } from "@convex-dev/react-query"
import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { useOnlineUsersCount } from "~/hooks/usePresenceData"

/**
 * Simple component to display the number of online users in the current organization
 */
export function OnlineUsersIndicator() {
	// Get current organization and user
	const { orgId } = useParams({ from: "/_app/$orgId" })

	const organizationId = orgId as Id<"organizations">
	const userQuery = useQuery(
		convexQuery(api.me.getCurrentUser, {
			organizationId,
		}),
	)

	const userId = userQuery.data?._id

	const onlineCount = useOnlineUsersCount(organizationId, userId)

	if (!organizationId || !userId) {
		return null
	}

	return (
		<div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
			<div className="h-2 w-2 rounded-full bg-green-500" />
			<span>{onlineCount} online</span>
		</div>
	)
}
