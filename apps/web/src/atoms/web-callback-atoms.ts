/**
 * @module Web OAuth callback atoms
 * @platform web
 * @description Effect Atom-based state management for web OAuth callback handling (JWT flow)
 */

import { Atom } from "effect/unstable/reactivity"
import {
	MissingAuthCodeError,
	OAuthCallbackError,
	OAuthCodeExpiredError,
	OAuthRedemptionPendingError,
	OAuthStateMismatchError,
	TokenDecodeError,
	TokenExchangeError,
	TokenStoreError,
} from "@hazel/domain/errors"
import { Effect } from "effect"
import { appRegistry } from "~/lib/registry"
import {
	completeWebCallbackEffect,
	getWebCallbackErrorInfo,
	getWebCallbackReturnTo,
	InvalidAuthStateError,
	type WebCallbackParams,
} from "~/lib/auth-flow"
import {
	getWebCallbackAttemptKey as buildWebCallbackAttemptKey,
	resetAllWebCallbackAttempts,
	resetWebCallbackAttempt,
	runWebCallbackAttemptOnce,
	type WebCallbackKeyParams,
} from "~/lib/web-callback-single-flight"
import { webAuthStatusAtom, webTokensAtom } from "./web-auth"

// ============================================================================
// Types
// ============================================================================

/**
 * Discriminated union for callback status
 */
export type WebCallbackStatus =
	| { _tag: "idle" }
	| { _tag: "exchanging" }
	| { _tag: "success"; returnTo: string }
	| { _tag: "error"; message: string; isRetryable: boolean }

// ============================================================================
// State Atoms
// ============================================================================

/**
 * Holds the current callback status
 */
export const webCallbackStatusAtom = Atom.make<WebCallbackStatus>({ _tag: "idle" }).pipe(Atom.keepAlive)

// ============================================================================
// Attempt Context
// ============================================================================

const callbackAttemptIds = new Map<string, string>()

const getOrCreateCallbackAttemptId = (attemptKey: string): string => {
	const existing = callbackAttemptIds.get(attemptKey)
	if (existing) {
		return existing
	}

	const attemptId = `web_callback_${crypto.randomUUID()}`
	callbackAttemptIds.set(attemptKey, attemptId)
	return attemptId
}

const logWebCallback = (level: "Info" | "Error", message: string, fields: Record<string, unknown>): void => {
	const effect = level === "Error" ? Effect.logError(message, fields) : Effect.logInfo(message, fields)
	void Effect.runFork(effect)
}

type WebCallbackResult =
	| { success: true; returnTo: string }
	| {
			success: false
			error:
				| InvalidAuthStateError
				| MissingAuthCodeError
				| OAuthCallbackError
				| OAuthCodeExpiredError
				| OAuthRedemptionPendingError
				| OAuthStateMismatchError
				| TokenDecodeError
				| TokenExchangeError
				| TokenStoreError
	  }

const executeWebCallback = async (
	params: WebCallbackParams,
	_attemptKey: string,
	attemptId: string,
): Promise<WebCallbackResult> => {
	return webCallbackExecutor({
		attemptId,
		params,
		returnTo: getWebCallbackReturnTo(params.state),
	})
}

type WebCallbackExecutorArgs = {
	attemptId: string
	params: WebCallbackParams
	returnTo: string
}

type WebCallbackExecutor = (args: WebCallbackExecutorArgs) => Promise<WebCallbackResult>

const defaultWebCallbackExecutor: WebCallbackExecutor = async ({ attemptId, params }) =>
	await completeWebCallbackEffect(params, attemptId)
		.pipe(
			Effect.map(({ returnTo, session }) => {
				appRegistry.set(webTokensAtom, session)
				appRegistry.set(webAuthStatusAtom, "authenticated")
				return { success: true as const, returnTo }
			}),
			Effect.catchTags({
				InvalidAuthStateError: (error) => Effect.succeed({ success: false as const, error }),
				MissingAuthCodeError: (error) => Effect.succeed({ success: false as const, error }),
				OAuthCallbackError: (error) => Effect.succeed({ success: false as const, error }),
				OAuthCodeExpiredError: (error) => Effect.succeed({ success: false as const, error }),
				OAuthStateMismatchError: (error) => Effect.succeed({ success: false as const, error }),
				OAuthRedemptionPendingError: (error) => Effect.succeed({ success: false as const, error }),
				TokenExchangeError: (error) => Effect.succeed({ success: false as const, error }),
				TokenDecodeError: (error) => Effect.succeed({ success: false as const, error }),
				TokenStoreError: (error) => Effect.succeed({ success: false as const, error }),
			}),
		)
		.pipe(Effect.runPromise)

let webCallbackExecutor: WebCallbackExecutor = defaultWebCallbackExecutor

export const setWebCallbackExecutorForTest = (executor: WebCallbackExecutor | null): void => {
	webCallbackExecutor = executor ?? defaultWebCallbackExecutor
}

export const getWebCallbackAttemptKey = (params: WebCallbackKeyParams): string =>
	buildWebCallbackAttemptKey(params)

export const startWebCallback = async (params: WebCallbackParams): Promise<void> => {
	const attemptKey = getWebCallbackAttemptKey(params)
	const attemptId = getOrCreateCallbackAttemptId(attemptKey)
	logWebCallback("Info", "[web-callback] Starting callback handling", {
		attemptId,
		attemptKey,
		hasCode: Boolean(params.code),
		hasState: Boolean(params.state),
		hasProviderError: Boolean(params.error),
	})

	await runWebCallbackAttemptOnce(
		attemptKey,
		async () => {
			appRegistry.set(webCallbackStatusAtom, { _tag: "exchanging" })
			const result = await executeWebCallback(params, attemptKey, attemptId)

			if (result.success) {
				appRegistry.set(webCallbackStatusAtom, { _tag: "success", returnTo: result.returnTo })
				logWebCallback("Info", "[web-callback] Callback completed", {
					attemptId,
					attemptKey,
					outcome: "success",
					returnTo: result.returnTo,
				})
			} else {
				const errorInfo = getWebCallbackErrorInfo(result.error)
				appRegistry.set(webCallbackStatusAtom, { _tag: "error", ...errorInfo })
				logWebCallback("Error", "[web-callback] Callback failed", {
					attemptId,
					attemptKey,
					outcome: "error",
					errorTag: result.error._tag,
					message: errorInfo.message,
					isRetryable: errorInfo.isRetryable,
				})
			}

			return result
		},
		(result) => result.success || !getWebCallbackErrorInfo(result.error).isRetryable,
	)
}

export const retryWebCallback = async (params: WebCallbackParams): Promise<void> => {
	const attemptKey = getWebCallbackAttemptKey(params)
	resetWebCallbackAttempt(attemptKey)
	await startWebCallback(params)
}

// ============================================================================
// State Reset
// ============================================================================

/**
 * Reset callback state for a fresh login flow.
 * Called during logout to clear stale state that survives client-side navigation.
 */
export const resetCallbackState = () => {
	resetAllWebCallbackAttempts()
	callbackAttemptIds.clear()
	appRegistry.set(webCallbackStatusAtom, { _tag: "idle" })
}
