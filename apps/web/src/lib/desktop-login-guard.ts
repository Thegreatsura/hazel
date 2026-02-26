import { clearDesktopTokens, getDesktopAccessToken } from "~/atoms/desktop-auth"
import { forceRefresh } from "~/lib/auth-token"
import { isTauri } from "~/lib/tauri"

const MIN_TOKEN_LENGTH = 10

export const shouldRedirectFromDesktopLogin = async (): Promise<boolean> => {
	if (!isTauri()) return false

	try {
		const token = await getDesktopAccessToken()
		if (!token || token.trim().length <= MIN_TOKEN_LENGTH) {
			return false
		}

		const refreshed = await forceRefresh()
		if (!refreshed) {
			await clearDesktopTokens()
			return false
		}

		const validatedToken = await getDesktopAccessToken()
		if (validatedToken && validatedToken.trim().length > MIN_TOKEN_LENGTH) {
			return true
		}

		await clearDesktopTokens()
		return false
	} catch (error) {
		console.error("[desktop-login] Session validation failed:", error)
		await clearDesktopTokens()
		return false
	}
}
