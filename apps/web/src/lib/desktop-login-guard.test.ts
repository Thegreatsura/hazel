import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"

vi.mock("~/atoms/desktop-auth", () => ({
	clearDesktopTokens: vi.fn(),
	getDesktopAccessToken: vi.fn(),
}))

vi.mock("~/lib/auth-token", () => ({
	forceRefresh: vi.fn(),
}))

vi.mock("~/lib/tauri", () => ({
	isTauri: vi.fn(),
}))

import { clearDesktopTokens, getDesktopAccessToken } from "~/atoms/desktop-auth"
import { forceRefresh } from "~/lib/auth-token"
import { shouldRedirectFromDesktopLogin } from "~/lib/desktop-login-guard"
import { isTauri } from "~/lib/tauri"

describe("shouldRedirectFromDesktopLogin", () => {
	beforeEach(() => {
		vi.resetAllMocks()
		;(isTauri as Mock).mockReturnValue(true)
		;(clearDesktopTokens as Mock).mockResolvedValue(undefined)
	})

	it("clears stale tokens and stays on login when refresh validation fails", async () => {
		;(getDesktopAccessToken as Mock).mockResolvedValue("stale-access-token")
		;(forceRefresh as Mock).mockResolvedValue(false)

		const shouldRedirect = await shouldRedirectFromDesktopLogin()

		expect(shouldRedirect).toBe(false)
		expect(forceRefresh).toHaveBeenCalledTimes(1)
		expect(clearDesktopTokens).toHaveBeenCalledTimes(1)
	})

	it("redirects when refresh validation succeeds and token remains valid", async () => {
		;(getDesktopAccessToken as Mock)
			.mockResolvedValueOnce("existing-access-token")
			.mockResolvedValueOnce("refreshed-access-token")
		;(forceRefresh as Mock).mockResolvedValue(true)

		const shouldRedirect = await shouldRedirectFromDesktopLogin()

		expect(shouldRedirect).toBe(true)
		expect(forceRefresh).toHaveBeenCalledTimes(1)
		expect(clearDesktopTokens).not.toHaveBeenCalled()
	})

	it("stays on login without attempting refresh when no access token exists", async () => {
		;(getDesktopAccessToken as Mock).mockResolvedValue(null)

		const shouldRedirect = await shouldRedirectFromDesktopLogin()

		expect(shouldRedirect).toBe(false)
		expect(forceRefresh).not.toHaveBeenCalled()
		expect(clearDesktopTokens).not.toHaveBeenCalled()
	})
})
