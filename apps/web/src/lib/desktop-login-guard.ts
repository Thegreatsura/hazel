import { Effect } from "effect"
import { clearDesktopTokens, getDesktopAccessToken } from "~/atoms/desktop-auth"
import { forceRefresh } from "~/lib/auth-token"
import { isTauri } from "~/lib/tauri"

const MIN_TOKEN_LENGTH = 10

const hasUsableToken = (token: string | null): boolean =>
	Boolean(token && token.trim().length > MIN_TOKEN_LENGTH)

export const shouldRedirectFromDesktopLogin = async (): Promise<boolean> =>
	await Effect.gen(function* () {
		if (!isTauri()) {
			return false
		}

		const token = yield* Effect.promise(() => getDesktopAccessToken())
		if (!hasUsableToken(token)) {
			return false
		}

		const refreshed = yield* Effect.promise(() => forceRefresh())
		if (!refreshed) {
			yield* Effect.promise(() => clearDesktopTokens())
			return false
		}

		const validatedToken = yield* Effect.promise(() => getDesktopAccessToken())
		if (hasUsableToken(validatedToken)) {
			return true
		}

		yield* Effect.promise(() => clearDesktopTokens())
		return false
	}).pipe(
		Effect.catch((error) =>
			Effect.gen(function* () {
				yield* Effect.logError("[desktop-login] Session validation failed", error)
				yield* Effect.promise(() => clearDesktopTokens())
				return false
			}),
		),
		Effect.runPromise,
	)
