import { useSyncExternalStore } from "react"
import { rpcEventClient } from "./event-client"
import { clearRequestTracking } from "./protocol-interceptor"
import type { CapturedRequest } from "./types"

/**
 * Global key to prevent double initialization during HMR
 */
const STORE_INITIALIZED_KEY = "__EFFECT_RPC_DEVTOOLS_STORE_INITIALIZED__" as const

declare global {
	var __EFFECT_RPC_DEVTOOLS_STORE_INITIALIZED__: boolean | undefined
}

/**
 * Maximum number of requests to keep in history
 */
const MAX_REQUESTS = 500

/**
 * In-memory store for captured RPC requests
 */
let requests: CapturedRequest[] = []
const listeners: Set<() => void> = new Set()

/**
 * Notify all listeners of state change
 */
const emitChange = () => {
	for (const listener of listeners) {
		listener()
	}
}

/**
 * Subscribe to store changes
 */
const subscribe = (callback: () => void): (() => void) => {
	listeners.add(callback)
	return () => {
		listeners.delete(callback)
	}
}

/**
 * Get current snapshot of requests
 */
const getSnapshot = (): CapturedRequest[] => requests

/**
 * Get server snapshot (same as client for this store)
 */
const getServerSnapshot = (): CapturedRequest[] => []

// Initialize event subscriptions only once (survives HMR)
if (import.meta.env.DEV && !globalThis[STORE_INITIALIZED_KEY]) {
	globalThis[STORE_INITIALIZED_KEY] = true

	// Listen for request events
	rpcEventClient.on("request", (event) => {
		const { payload } = event
		const newRequest: CapturedRequest = {
			captureId: crypto.randomUUID(),
			id: payload.id,
			method: payload.method,
			payload: payload.payload,
			headers: payload.headers,
			timestamp: payload.timestamp,
			startTime: payload.timestamp,
		}

		// Add to beginning (newest first) and trim if needed
		requests = [newRequest, ...requests].slice(0, MAX_REQUESTS)
		emitChange()
	})

	// Listen for response events
	rpcEventClient.on("response", (event) => {
		const { payload } = event
		requests = requests.map((req) =>
			req.id === payload.requestId
				? {
						...req,
						response: {
							status: payload.status,
							data: payload.data,
							duration: payload.duration,
							timestamp: payload.timestamp,
						},
					}
				: req,
		)
		emitChange()
	})

	// Listen for clear events
	rpcEventClient.on("clear", () => {
		requests = []
		emitChange()
	})
}

/**
 * React hook to access captured RPC requests
 * Uses useSyncExternalStore for proper concurrent mode support
 */
export const useRpcRequests = (): CapturedRequest[] => {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Clear all captured requests
 */
export const clearRequests = () => {
	requests = []
	clearRequestTracking()
	rpcEventClient.emit("clear", undefined as never)
	emitChange()
}

/**
 * Get request statistics
 */
export const useRpcStats = () => {
	const requests = useRpcRequests()

	const total = requests.length
	const pending = requests.filter((r) => !r.response).length
	const success = requests.filter((r) => r.response?.status === "success").length
	const error = requests.filter((r) => r.response?.status === "error").length
	const avgDuration =
		requests
			.filter((r) => r.response?.duration)
			.reduce((sum, r) => sum + (r.response?.duration ?? 0), 0) /
			(requests.filter((r) => r.response?.duration).length || 1) || 0

	return {
		total,
		pending,
		success,
		error,
		avgDuration: Math.round(avgDuration),
	}
}
