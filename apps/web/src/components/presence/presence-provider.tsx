import usePresenceHook from "@convex-dev/presence/react"
import { convexQuery } from "@convex-dev/react-query"
import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { createContext, type ReactNode, useContext } from "react"

interface PresenceContextValue {
	presenceList: Array<{
		userId: string
		online: boolean
		lastDisconnected: number
	}>
	isUserOnline: (userId: string) => boolean
	organizationId?: Id<"organizations">
	userId?: Id<"users">
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined)

export function usePresence() {
	const context = useContext(PresenceContext)
	if (!context) {
		throw new Error("usePresence must be used within a PresenceProvider")
	}
	return context
}

interface PresenceProviderProps {
	children: ReactNode
}

interface PresenceTrackerProps {
	organizationId: Id<"organizations">
	userId: Id<"users">
	children: ReactNode
}

// Inner component that actually calls the usePresence hook
function PresenceTracker({ organizationId, userId, children }: PresenceTrackerProps) {
	const presenceData = usePresenceHook(api.presence, organizationId, userId, 10000)

	// The hook returns an array of presence states directly
	const presenceList = presenceData || []

	const isUserOnline = (checkUserId: string) => {
		const userPresence = presenceList.find((p: any) => p.userId === checkUserId)
		return userPresence?.online ?? false
	}

	const contextValue: PresenceContextValue = {
		presenceList,
		isUserOnline,
		organizationId,
		userId,
	}

	return <PresenceContext.Provider value={contextValue}>{children}</PresenceContext.Provider>
}

export function PresenceProvider({ children }: PresenceProviderProps) {
	const { orgId } = useParams({ from: "/app/$orgId" })

	const organizationId = orgId as Id<"organizations">
	const userQuery = useQuery(
		convexQuery(api.me.getCurrentUser, {
			organizationId,
		}),
	)

	const userId = userQuery.data?._id

	// Only render PresenceTracker when both IDs are available
	if (!organizationId || !userId) {
		// Provide a default context value when IDs are not available
		const defaultContextValue: PresenceContextValue = {
			presenceList: [],
			isUserOnline: () => false,
			organizationId: undefined,
			userId: undefined,
		}
		return <PresenceContext.Provider value={defaultContextValue}>{children}</PresenceContext.Provider>
	}

	return (
		<PresenceTracker organizationId={organizationId} userId={userId}>
			{children}
		</PresenceTracker>
	)
}
