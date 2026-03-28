/**
 * @module Desktop OAuth callback atoms
 * @platform web (opened in browser during desktop OAuth)
 * @description Effect Atom-based state management for desktop OAuth callback handling
 */

import { Atom } from "effect/unstable/reactivity"
import { runtime } from "~/lib/services/common/runtime"
import {
	copyDesktopCallbackToClipboardEffect,
	forwardDesktopCallbackEffect,
	getDesktopCallbackErrorInfo,
	type DesktopCallbackParams,
} from "~/lib/auth-flow"
import { Effect } from "effect"

export type DesktopCallbackStatus =
	| { _tag: "idle" }
	| { _tag: "connecting" }
	| { _tag: "success" }
	| { _tag: "error"; message: string; isRetryable: boolean; isConnectionError?: boolean }
	| { _tag: "copied"; message: string }

export const desktopCallbackStatusAtom = Atom.make<DesktopCallbackStatus>({ _tag: "idle" }).pipe(
	Atom.keepAlive,
)

interface AtomGetter {
	<T>(atom: Atom.Atom<T>): T
	set<T>(atom: Atom.Writable<T>, value: T): void
	addFinalizer(fn: () => void): void
	refresh<T>(atom: Atom.Atom<T>): void
}

const handleCallback = (params: DesktopCallbackParams, get: AtomGetter) =>
	Effect.gen(function* () {
		get.set(desktopCallbackStatusAtom, { _tag: "connecting" })

		yield* forwardDesktopCallbackEffect(params).pipe(
			Effect.matchEffect({
				onSuccess: () =>
					Effect.sync(() => {
						get.set(desktopCallbackStatusAtom, { _tag: "success" })
					}),
				onFailure: (error) =>
					Effect.sync(() => {
						get.set(desktopCallbackStatusAtom, {
							_tag: "error",
							...getDesktopCallbackErrorInfo(error),
						})
					}),
			}),
		)
	})

export const createCallbackInitAtom = (params: DesktopCallbackParams) =>
	Atom.make((get) => {
		const fiber = runtime.runFork(handleCallback(params, get))

		get.addFinalizer(() => {
			fiber.interruptUnsafe()
		})

		return null
	})

export const retryCallbackAtom = Atom.fn(
	Effect.fnUntraced(function* (params: DesktopCallbackParams, get) {
		yield* handleCallback(params, get)
	}),
)

export const copyCallbackToClipboardAtom = Atom.fn(
	Effect.fnUntraced(function* (params: DesktopCallbackParams, get) {
		yield* copyDesktopCallbackToClipboardEffect(params)
		get.set(desktopCallbackStatusAtom, {
			_tag: "copied",
			message:
				'Copied! Open the Hazel desktop app and click "Paste from clipboard" to complete sign in.',
		})
	}),
)
