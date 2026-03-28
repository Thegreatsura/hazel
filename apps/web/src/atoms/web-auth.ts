/**
 * @module Web authentication atoms
 * @platform web
 * @description Effect Atom-based state management for web JWT authentication
 *
 * Token refresh logic is consolidated in ~/lib/auth-token.ts.
 * This module owns atom definitions, init, logout, and the scheduler.
 */

import { Atom } from "effect/unstable/reactivity"
import { Duration, Effect } from "effect"
import { runtime } from "~/lib/services/common/runtime"
import { isTauri } from "~/lib/tauri"
import { forceRefreshEffect } from "~/lib/auth-token"
import {
	loadStoredSessionEffect,
	logoutEffect,
	recoverSessionEffect,
	type StartLoginOptions,
} from "~/lib/auth-flow"

// ============================================================================
// Types
// ============================================================================

export interface WebTokens {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

export type WebAuthStatus = "idle" | "loading" | "authenticated" | "error"

export interface WebAuthError {
	_tag: string
	message: string
}

const resetWebAuthState = (get?: { set<T>(atom: Atom.Writable<T>, value: T): void }): void => {
	get?.set(webTokensAtom, null)
	get?.set(webAuthStatusAtom, "idle")
	get?.set(webAuthErrorAtom, null)
}

const syncWebSession = (
	session: WebTokens | null,
	get: { set<T>(atom: Atom.Writable<T>, value: T): void },
) => {
	get.set(webTokensAtom, session)
	get.set(webAuthStatusAtom, session ? "authenticated" : "idle")
	get.set(webAuthErrorAtom, null)
}

export const recoverWebSession = (options?: StartLoginOptions): Promise<void> =>
	runtime.runPromise(
		Effect.gen(function* () {
			if (isTauri()) {
				return
			}

			yield* recoverSessionEffect("web", options)
		}),
	)

// ============================================================================
// Constants
// ============================================================================

const REFRESH_BUFFER_MS = 5 * 60 * 1000

// ============================================================================
// Core State Atoms
// ============================================================================

export const webTokensAtom = Atom.make<WebTokens | null>(null).pipe(Atom.keepAlive)
export const webAuthStatusAtom = Atom.make<WebAuthStatus>("idle").pipe(Atom.keepAlive)
export const webAuthErrorAtom = Atom.make<WebAuthError | null>(null).pipe(Atom.keepAlive)

// ============================================================================
// Derived Atoms
// ============================================================================

export const isWebAuthenticatedAtom = Atom.make((get) => get(webTokensAtom) !== null)

// ============================================================================
// Action Atoms
// ============================================================================

/**
 * Action atom that performs web logout
 * Clears tokens from storage, resets atom state, and redirects through WorkOS logout
 */
export const webLogoutAtom = Atom.fn(
	Effect.fnUntraced(function* (options?: { redirectTo?: string }, get?) {
		if (isTauri()) {
			yield* Effect.log("[web-auth] In Tauri environment, skipping web logout")
			return
		}

		resetWebAuthState(get)
		yield* logoutEffect("web", options)
	}),
)

/**
 * Action atom that forces an immediate token refresh via AuthToken
 */
export const webForceRefreshAtom = Atom.fn(
	Effect.fnUntraced(function* (_: void) {
		if (isTauri()) return false
		return yield* forceRefreshEffect
	}),
)

// ============================================================================
// Initialization Atom
// ============================================================================

export const webInitAtom = Atom.make((get) => {
	if (isTauri()) return null

	const loadTokens = Effect.gen(function* () {
		get.set(webAuthStatusAtom, "loading")
		const session = yield* loadStoredSessionEffect("web")

		if (session) {
			syncWebSession(session, get)
			yield* Effect.log("[web-auth] Loaded stored web session")
			return
		}

		syncWebSession(null, get)
		yield* Effect.log("[web-auth] No valid stored web session found")
	}).pipe(
		Effect.catch((error) => {
			void Effect.runFork(Effect.logError("[web-auth] Failed to load tokens", error))
			get.set(webAuthStatusAtom, "error")
			get.set(webAuthErrorAtom, {
				_tag: "AuthInitError",
				message: "Failed to load tokens",
			})
			return Effect.void
		}),
	)

	const fiber = runtime.runFork(loadTokens)

	get.addFinalizer(() => {
		fiber.interruptUnsafe()
	})

	return null
}).pipe(Atom.keepAlive)

// ============================================================================
// Token Refresh Scheduler Atom
// ============================================================================

export const webTokenSchedulerAtom = Atom.make((get) => {
	const tokens = get(webTokensAtom)

	if (!tokens || isTauri()) return null

	const timeUntilRefresh = tokens.expiresAt - Date.now() - REFRESH_BUFFER_MS

	if (timeUntilRefresh <= 0) {
		runtime.runFork(
			Effect.gen(function* () {
				yield* Effect.log("[web-auth] Token expired or expiring soon, refreshing now")
				yield* forceRefreshEffect
			}),
		)
		return { scheduledFor: Date.now(), immediate: true }
	}

	const minutes = Math.round(timeUntilRefresh / 1000 / 60)
	const scheduledFor = tokens.expiresAt - REFRESH_BUFFER_MS

	const refreshSchedule = Effect.gen(function* () {
		yield* Effect.log(`[web-auth] Scheduling refresh in ${minutes} minutes`)
		yield* Effect.sleep(Duration.millis(timeUntilRefresh))
		yield* Effect.log("[web-auth] Scheduled refresh triggered")
		yield* forceRefreshEffect
	})

	const fiber = runtime.runFork(refreshSchedule)

	get.addFinalizer(() => {
		fiber.interruptUnsafe()
	})

	return { scheduledFor, immediate: false }
}).pipe(Atom.keepAlive)
