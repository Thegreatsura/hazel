import { Atom, AsyncResult } from "effect/unstable/reactivity"
import { useAtomSet, useAtomValue } from "@effect/atom-react"
import type { OrganizationId } from "@hazel/schema"
import { desktopInitAtom, desktopLogoutAtom, desktopTokenSchedulerAtom } from "~/atoms/desktop-auth"
import { webInitAtom, webLogoutAtom, webTokenSchedulerAtom } from "~/atoms/web-auth"
import { normalizeAuthReturnTo, recoverSession, startLogin } from "~/lib/auth-flow"
import { HazelRpcClient } from "./services/common/rpc-atom-client"
import { isTauri } from "./tauri"

interface LoginOptions {
	returnTo?: string
	organizationId?: OrganizationId
	invitationToken?: string
}

interface LogoutOptions {
	redirectTo?: string
}

export const restartWebLogin = (options?: LoginOptions) => recoverSession("web", options)

/**
 * Query atom that fetches the current user from the API
 */
export const currentUserQueryAtom = HazelRpcClient.query("user.me", void 0, {
	reactivityKeys: ["currentUser"],
})

/**
 * Combined auth state atom - reads currentUserQueryAtom only once
 * to avoid triggering duplicate RPC calls
 */
const authStateAtom = Atom.make((get) => {
	const result = get(currentUserQueryAtom)
	return {
		user: result,
		isLoading: result._tag === "Initial" || result.waiting,
	}
})

/**
 * Derived atom that returns the current user
 * Returns null if on a public route or if the query failed
 */
export const userAtom = Atom.make((get) => get(authStateAtom).user)

export function useAuth() {
	const { user: userResult, isLoading } = useAtomValue(authStateAtom)

	// Initialize auth atoms for both platforms
	// Each atom internally checks platform and returns early if not applicable
	// Desktop: loads stored tokens from Tauri store, starts refresh scheduler
	useAtomValue(desktopInitAtom)
	useAtomValue(desktopTokenSchedulerAtom)
	// Web: loads stored tokens from localStorage, starts refresh scheduler
	useAtomValue(webInitAtom)
	useAtomValue(webTokenSchedulerAtom)

	const desktopLogout = useAtomSet(desktopLogoutAtom)

	// Web auth action atoms
	const webLogout = useAtomSet(webLogoutAtom)

	const login = (options?: LoginOptions) => {
		const returnTo = normalizeAuthReturnTo(
			options?.returnTo || location.pathname + location.search + location.hash,
		)

		if (isTauri()) {
			void startLogin("desktop", {
				returnTo,
				organizationId: options?.organizationId,
				invitationToken: options?.invitationToken,
			})
			return
		}

		void startLogin("web", {
			returnTo,
			organizationId: options?.organizationId,
			invitationToken: options?.invitationToken,
		})
	}

	const logout = async (options?: LogoutOptions) => {
		if (isTauri()) {
			desktopLogout(options)
			return
		}

		webLogout(options)
	}

	return {
		user: AsyncResult.getOrElse(userResult, () => null),
		error: AsyncResult.error(userResult),
		isLoading,
		login,
		logout,
	}
}
