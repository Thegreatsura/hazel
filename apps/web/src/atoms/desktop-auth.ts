/**
 * @module Desktop authentication atoms
 * @platform desktop
 * @description Effect Atom-based state management for desktop OAuth authentication
 *
 * Token refresh logic is consolidated in ~/lib/auth-token.ts.
 * This module owns atom definitions, init, login, logout, and the scheduler.
 */

import { Atom } from "effect/unstable/reactivity"
import type { OrganizationId } from "@hazel/schema"
import { Duration, Effect } from "effect"
import { appRegistry } from "~/lib/registry"
import { runtime } from "~/lib/services/common/runtime"
import { isTauri } from "~/lib/tauri"
import { forceRefreshEffect } from "~/lib/auth-token"
import {
	authenticateDesktopFromClipboardEffect,
	clearStoredSession,
	getStoredAccessToken,
	loadStoredSessionEffect,
	logoutEffect,
	startLoginEffect,
} from "~/lib/auth-flow"

export interface DesktopTokens {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

export type DesktopAuthStatus = "idle" | "loading" | "authenticated" | "error"

export interface DesktopAuthError {
	_tag: string
	message: string
}

interface DesktopLoginOptions {
	returnTo?: string
	organizationId?: OrganizationId
	invitationToken?: string
}

interface DesktopLogoutOptions {
	redirectTo?: string
}

const REFRESH_BUFFER_MS = 5 * 60 * 1000

export const desktopTokensAtom = Atom.make<DesktopTokens | null>(null).pipe(Atom.keepAlive)
export const desktopAuthStatusAtom = Atom.make<DesktopAuthStatus>("idle").pipe(Atom.keepAlive)
export const desktopAuthErrorAtom = Atom.make<DesktopAuthError | null>(null).pipe(Atom.keepAlive)

export const isDesktopAuthenticatedAtom = Atom.make((get) => get(desktopTokensAtom) !== null)

const toErrorInfo = (error: unknown): DesktopAuthError => {
	const err = error as { _tag?: string; message?: string } | undefined
	return {
		_tag: err?._tag ?? "UnknownError",
		message: err?.message ?? "Unknown error",
	}
}

const resetDesktopAuthState = (get?: { set<T>(atom: Atom.Writable<T>, value: T): void }): void => {
	get?.set(desktopTokensAtom, null)
	get?.set(desktopAuthStatusAtom, "idle")
	get?.set(desktopAuthErrorAtom, null)
}

const syncDesktopSession = (
	session: DesktopTokens | null,
	get: { set<T>(atom: Atom.Writable<T>, value: T): void },
): void => {
	get.set(desktopTokensAtom, session)
	get.set(desktopAuthStatusAtom, session ? "authenticated" : "idle")
	get.set(desktopAuthErrorAtom, null)
}

export const desktopLoginAtom = Atom.fn(
	Effect.fnUntraced(function* (options: DesktopLoginOptions | undefined, get) {
		if (!isTauri()) {
			yield* Effect.log("[desktop-auth] Not in Tauri environment, skipping desktop login")
			return
		}

		get.set(desktopAuthStatusAtom, "loading")
		get.set(desktopAuthErrorAtom, null)

		const result = yield* startLoginEffect("desktop", options).pipe(
			Effect.catch((error) => {
				get.set(desktopAuthStatusAtom, "error")
				get.set(desktopAuthErrorAtom, toErrorInfo(error))
				return Effect.fail(error)
			}),
		)

		if (!result) {
			return
		}

		syncDesktopSession(result.session, get)
		yield* Effect.log(`[desktop-auth] Login successful, navigating to: ${result.returnTo}`)
		window.location.href = result.returnTo
	}),
)

export const desktopLogoutAtom = Atom.fn(
	Effect.fnUntraced(function* (options: DesktopLogoutOptions | undefined, get) {
		if (!isTauri()) {
			yield* Effect.log("[desktop-auth] Not in Tauri environment, skipping desktop logout")
			return
		}

		resetDesktopAuthState(get)
		yield* logoutEffect("desktop", options)
	}),
)

export const desktopForceRefreshAtom = Atom.fn(
	Effect.fnUntraced(function* (_: void) {
		if (!isTauri()) return false
		return yield* forceRefreshEffect
	}),
)

export const desktopLoginFromClipboardAtom = Atom.fn(
	Effect.fnUntraced(function* (_: void, get) {
		if (!isTauri()) return

		get.set(desktopAuthStatusAtom, "loading")
		get.set(desktopAuthErrorAtom, null)

		const session = yield* authenticateDesktopFromClipboardEffect().pipe(
			Effect.catch((error) => {
				get.set(desktopAuthStatusAtom, "error")
				get.set(desktopAuthErrorAtom, toErrorInfo(error))
				return Effect.fail(error)
			}),
		)

		syncDesktopSession(session, get)
		yield* Effect.log("[desktop-auth] Clipboard login successful")
		window.location.href = "/"
	}),
)

export const desktopInitAtom = Atom.make((get) => {
	if (!isTauri()) return null

	const loadTokens = Effect.gen(function* () {
		get.set(desktopAuthStatusAtom, "loading")
		const session = yield* loadStoredSessionEffect("desktop")

		if (session) {
			syncDesktopSession(session, get)
			yield* Effect.log("[desktop-auth] Loaded stored desktop session")
			return
		}

		syncDesktopSession(null, get)
		yield* Effect.log("[desktop-auth] No valid stored desktop session found")
	}).pipe(
		Effect.catch((error) => {
			void Effect.runFork(Effect.logError("[desktop-auth] Failed to load tokens", error))
			get.set(desktopAuthStatusAtom, "error")
			get.set(desktopAuthErrorAtom, toErrorInfo(error))
			return Effect.void
		}),
	)

	const fiber = runtime.runFork(loadTokens)

	get.addFinalizer(() => {
		fiber.interruptUnsafe()
	})

	return null
}).pipe(Atom.keepAlive)

export const desktopTokenSchedulerAtom = Atom.make((get) => {
	const tokens = get(desktopTokensAtom)

	if (!tokens || !isTauri()) return null

	const timeUntilRefresh = tokens.expiresAt - Date.now() - REFRESH_BUFFER_MS

	if (timeUntilRefresh <= 0) {
		runtime.runFork(
			Effect.gen(function* () {
				yield* Effect.log("[desktop-auth] Token expired or expiring soon, refreshing now")
				yield* forceRefreshEffect
			}),
		)
		return { scheduledFor: Date.now(), immediate: true }
	}

	const minutes = Math.round(timeUntilRefresh / 1000 / 60)
	const scheduledFor = tokens.expiresAt - REFRESH_BUFFER_MS

	const refreshSchedule = Effect.gen(function* () {
		yield* Effect.log(`[desktop-auth] Scheduling refresh in ${minutes} minutes`)
		yield* Effect.sleep(Duration.millis(timeUntilRefresh))
		yield* Effect.log("[desktop-auth] Scheduled refresh triggered")
		yield* forceRefreshEffect
	})

	const fiber = runtime.runFork(refreshSchedule)

	get.addFinalizer(() => {
		fiber.interruptUnsafe()
	})

	return { scheduledFor, immediate: false }
}).pipe(Atom.keepAlive)

export const getDesktopAccessToken = (): Promise<string | null> => {
	if (!isTauri()) return Promise.resolve(null)
	return getStoredAccessToken("desktop")
}

export const clearDesktopTokens = async (): Promise<void> => {
	if (!isTauri()) {
		return
	}

	await clearStoredSession("desktop")
	appRegistry.set(desktopTokensAtom, null)
	appRegistry.set(desktopAuthStatusAtom, "idle")
	appRegistry.set(desktopAuthErrorAtom, null)
}
