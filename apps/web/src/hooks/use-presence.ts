import { Atom, Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { type ChannelId, UserId } from "@hazel/db/schema"
import { eq, useLiveQuery } from "@tanstack/react-db"
import { DateTime, Duration, Effect, Schedule, Stream } from "effect"
import { useCallback, useEffect, useRef } from "react"
import { userPresenceStatusCollection } from "~/db/collections"
import { useAuth } from "~/lib/auth"
import { HazelApiClient } from "~/lib/services/common/atom-client"
import { router } from "~/main"

type PresenceStatus = "online" | "away" | "busy" | "dnd" | "offline"

const AFK_TIMEOUT = Duration.minutes(5)
const OFFLINE_TIMEOUT = Duration.minutes(2)
const UPDATE_INTERVAL = Duration.seconds(30)

// ============================================================================
// Core Atoms
// ============================================================================

/**
 * Atom that tracks the last user activity timestamp
 * Updates on mousemove, keydown, scroll, click, touchstart
 */
const lastActivityAtom = Atom.make((get) => {
	let lastActivity = DateTime.unsafeMake(new Date())

	const handleActivity = () => {
		lastActivity = DateTime.unsafeMake(new Date())
		get.setSelf(lastActivity)
	}

	const events = ["mousemove", "keydown", "scroll", "click", "touchstart"]
	events.forEach((event) => {
		window.addEventListener(event, handleActivity, { passive: true })
	})

	get.addFinalizer(() => {
		events.forEach((event) => {
			window.removeEventListener(event, handleActivity)
		})
	})

	return lastActivity
}).pipe(Atom.keepAlive)

/**
 * Atom that tracks window visibility state
 * Returns { hidden: boolean, hiddenSince: DateTime | null }
 */
const windowVisibilityAtom = Atom.make((get) => {
	let state = {
		hidden: document.hidden,
		hiddenSince: document.hidden ? DateTime.unsafeMake(new Date()) : null,
	}

	const handleVisibilityChange = () => {
		const isHidden = document.hidden
		state = {
			hidden: isHidden,
			hiddenSince: isHidden ? DateTime.unsafeMake(new Date()) : null,
		}
		get.setSelf(state)
	}

	document.addEventListener("visibilitychange", handleVisibilityChange)

	get.addFinalizer(() => {
		document.removeEventListener("visibilitychange", handleVisibilityChange)
	})

	return state
}).pipe(Atom.keepAlive)

/**
 * Atom for manual status updates
 * Stores the user's manually set status and custom message
 */
interface ManualStatus {
	status: PresenceStatus | null
	customMessage: string | null
	previousStatus: PresenceStatus
}

const manualStatusAtom = Atom.make<ManualStatus>({
	status: null,
	customMessage: null,
	previousStatus: "online",
}).pipe(Atom.keepAlive)

/**
 * Derived atom that determines if the user is AFK
 * Uses a Stream that checks every 10 seconds if activity timeout has been exceeded
 */
const afkStateAtom = Atom.make((get) =>
	Stream.fromSchedule(Schedule.spaced(Duration.seconds(10))).pipe(
		Stream.map(() => {
			const lastActivity = get(lastActivityAtom)
			const manualStatus = get(manualStatusAtom)
			const now = DateTime.unsafeMake(new Date())
			const timeSinceActivity = DateTime.distance(lastActivity, now)

			const isAFK =
				Duration.greaterThanOrEqualTo(timeSinceActivity, AFK_TIMEOUT) && manualStatus.status !== "away"

			return {
				isAFK,
				timeSinceActivity,
				shouldMarkAway: isAFK && manualStatus.status !== "busy" && manualStatus.status !== "dnd",
			}
		}),
	),
).pipe(Atom.keepAlive)

/**
 * Derived atom that computes the final presence status
 * Combines manual status, AFK detection, and window visibility
 */
const computedPresenceStatusAtom = Atom.make((get) =>
	Effect.gen(function* () {
		const manualStatus = get(manualStatusAtom)
		const afkState = yield* get.result(afkStateAtom)
		const windowVisibility = get(windowVisibilityAtom)

		// Manual status takes precedence
		if (manualStatus.status !== null) {
			return manualStatus.status
		}

		// Check if window has been hidden long enough to mark offline
		if (windowVisibility.hidden && windowVisibility.hiddenSince) {
			const now = DateTime.unsafeMake(new Date())
			const hiddenDuration = DateTime.distance(windowVisibility.hiddenSince, now)
			if (Duration.greaterThanOrEqualTo(hiddenDuration, OFFLINE_TIMEOUT)) {
				return "offline" as PresenceStatus
			}
		}

		// Mark as away if AFK
		if (afkState.shouldMarkAway) {
			return "away" as PresenceStatus
		}

		// Default to online
		return "online" as PresenceStatus
	}),
)

/**
 * Atom that tracks the current route's channel ID
 */
const currentChannelIdAtom = Atom.make((get) => {
	let currentChannelId: string | null = null

	const unsubscribe = router.subscribe("onResolved", (event) => {
		// Extract channel ID from pathname
		const paramsId = event.toLocation.pathname.split("/").pop()
		const channelId = paramsId && paramsId.length > 0 ? paramsId : null

		if (channelId !== currentChannelId) {
			currentChannelId = channelId
			get.setSelf(channelId)
		}
	})

	get.addFinalizer(unsubscribe)

	// Get initial value from current route
	const pathSegments = router.state.location.pathname.split("/")
	currentChannelId = pathSegments[pathSegments.length - 1] || null
	return currentChannelId
}).pipe(Atom.keepAlive)

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Mutation atom for updating presence status
 */
const updatePresenceStatusMutation = HazelApiClient.mutation("presence", "updateStatus")

/**
 * Mutation atom for updating active channel
 */
const updateActiveChannelMutation = HazelApiClient.mutation("presence", "updateActiveChannel")

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for managing the current user's presence status
 */
export function usePresence() {
	const { user } = useAuth()

	// Query current presence from DB (still using TanStack for real-time sync)
	const { data: presenceData } = useLiveQuery(
		(q) =>
			user?.id
				? q
						.from({ presence: userPresenceStatusCollection })
						.where(({ presence }) => eq(presence.userId, UserId.make(user.id)))
						.orderBy(({ presence }) => presence.updatedAt, "desc")
						.limit(1)
				: undefined,
		[user?.id],
	)

	const currentPresence = presenceData?.[0]

	// Read computed status (unwrap Result)
	const computedStatusResult = useAtomValue(computedPresenceStatusAtom)
	const computedStatus = Result.getOrElse(computedStatusResult, () => "online" as PresenceStatus)

	// Read AFK state (unwrap Result)
	const afkStateResult = useAtomValue(afkStateAtom)
	const afkState = Result.getOrElse(afkStateResult, () => ({
		isAFK: false,
		timeSinceActivity: 0,
		shouldMarkAway: false,
	}))

	const currentChannelId = useAtomValue(currentChannelIdAtom)

	// Get mutation setters
	const updateStatus = useAtomSet(updatePresenceStatusMutation, { mode: "promiseExit" })
	const updateActiveChannel = useAtomSet(updateActiveChannelMutation, { mode: "promiseExit" })

	// Track last sent status to avoid redundant updates
	const lastSentStatusRef = useRef<PresenceStatus | null>(null)
	const lastSentChannelRef = useRef<string | null>(null)

	// Sync computed status to server when it changes
	useEffect(() => {
		if (!user?.id) return
		if (lastSentStatusRef.current === computedStatus) return

		lastSentStatusRef.current = computedStatus

		updateStatus({
			payload: {
				status: computedStatus,
				customMessage: null,
			},
		})
	}, [computedStatus, user?.id, updateStatus])

	// Sync active channel to server when it changes
	useEffect(() => {
		if (!user?.id) return
		if (lastSentChannelRef.current === currentChannelId) return

		lastSentChannelRef.current = currentChannelId

		updateActiveChannel({
			payload: {
				activeChannelId: currentChannelId ? (currentChannelId as ChannelId) : null,
			},
		})
	}, [currentChannelId, user?.id, updateActiveChannel])

	// Heartbeat: update timestamp periodically
	useEffect(() => {
		if (!user?.id || !currentPresence?.id) return

		const interval = setInterval(() => {
			updateStatus({
				payload: {
					status: computedStatus,
					customMessage: null,
				},
			})
		}, Duration.toMillis(UPDATE_INTERVAL))

		return () => clearInterval(interval)
	}, [user?.id, currentPresence?.id, computedStatus, updateStatus])

	// Ref to track previous status for manual updates
	const previousManualStatusRef = useRef<PresenceStatus>("online")

	// Manual status setter
	const setStatus = useCallback(
		async (status: PresenceStatus, customMessage?: string) => {
			if (!user?.id) return

			// Update local atom state imperatively via batch
			Atom.batch(() => {
				Atom.set(manualStatusAtom, {
					status,
					customMessage: customMessage ?? null,
					previousStatus: previousManualStatusRef.current,
				})
			})

			// Track for next time
			previousManualStatusRef.current = status

			// Update on server
			await updateStatus({
				payload: {
					status,
					customMessage: customMessage ?? null,
				},
			})
		},
		[user?.id, updateStatus],
	)

	return {
		status: currentPresence?.status ?? computedStatus,
		isAFK: afkState.isAFK,
		setStatus,
		activeChannelId: currentPresence?.activeChannelId,
		customMessage: currentPresence?.customMessage,
	}
}

/**
 * Hook to get another user's presence
 */
export function useUserPresence(userId: string) {
	const { data: presenceData } = useLiveQuery(
		(q) =>
			q
				.from({ presence: userPresenceStatusCollection })
				.where(({ presence }) => eq(presence.userId, UserId.make(userId)))
				.orderBy(({ presence }) => presence.updatedAt, "desc")
				.limit(1),
		[userId],
	)

	const presence = presenceData?.[0]

	return {
		status: presence?.status ?? ("offline" as const),
		isOnline:
			presence?.status === "online" ||
			presence?.status === "busy" ||
			presence?.status === "dnd" ||
			presence?.status === "away",
		activeChannelId: presence?.activeChannelId,
		customMessage: presence?.customMessage,
		lastUpdated: presence?.updatedAt,
	}
}
