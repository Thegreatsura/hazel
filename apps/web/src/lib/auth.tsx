import { Atom, Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import type { OrganizationId } from "@hazel/schema"
import { Effect } from "effect"
import { router } from "~/main"
import { HazelRpcClient } from "./services/common/rpc-atom-client"

interface LoginOptions {
	returnTo?: string
	organizationId?: OrganizationId
	invitationToken?: string
}

interface LogoutOptions {
	redirectTo?: string
}

/**
 * Atom that tracks whether the current route is a public route
 * (i.e., starts with /auth)
 */
const isPublicRouteAtom = Atom.make((get) => {
	const unsubscribe = router.subscribe("onResolved", (event) => {
		get.setSelf(event.toLocation.pathname.startsWith("/auth"))
	})

	get.addFinalizer(unsubscribe)

	return router.state.location.pathname.startsWith("/auth")
}).pipe(Atom.keepAlive)

/**
 * Query atom that fetches the current user from the API
 */
const currentUserQueryAtom = HazelRpcClient.query("user.me", void 0, {
	reactivityKeys: ["currentUser"],
})

/**
 * Derived atom that returns the current user
 * Returns null if on a public route or if the query failed
 */
export const userAtom = Atom.make((get) => {
	const isPublicRoute = get(isPublicRouteAtom)
	if (isPublicRoute) {
		return Result.success(null)
	}

	const result = get(currentUserQueryAtom)
	return result
})

/**
 * Derived atom that returns whether the auth state is loading
 */
const isLoadingAtom = Atom.make((get) => {
	const isPublicRoute = get(isPublicRouteAtom)
	if (isPublicRoute) {
		return false
	}

	const result = get(currentUserQueryAtom)
	return result._tag === "Initial" || result.waiting
})

/**
 * Logout function atom
 */
const logoutAtom = Atom.fn(
	Effect.fnUntraced(function* (options?: LogoutOptions) {
		const redirectTo = options?.redirectTo || "/"
		const logoutUrl = new URL("/auth/logout", import.meta.env.VITE_BACKEND_URL)
		logoutUrl.searchParams.set("redirectTo", redirectTo)
		window.location.href = logoutUrl.toString()
	}),
)

export function useAuth() {
	const userResult = useAtomValue(userAtom)
	const isLoading = useAtomValue(isLoadingAtom)
	const logoutFn = useAtomSet(logoutAtom)

	const login = (options?: LoginOptions) => {
		const loginUrl = new URL("/auth/login", import.meta.env.VITE_BACKEND_URL)

		const returnTo = options?.returnTo || location.href
		loginUrl.searchParams.set("returnTo", returnTo)

		if (options?.organizationId) {
			loginUrl.searchParams.set("organizationId", options.organizationId)
		}
		if (options?.invitationToken) {
			loginUrl.searchParams.set("invitationToken", options.invitationToken)
		}

		window.location.href = loginUrl.toString()
	}

	const logout = (options?: LogoutOptions) => {
		logoutFn(options)
	}

	return {
		user: Result.getOrElse(userResult, () => null),
		error: Result.error(userResult),
		isLoading,
		login,
		logout,
	}
}
