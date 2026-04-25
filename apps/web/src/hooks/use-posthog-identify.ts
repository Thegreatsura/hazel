import { usePostHog } from "posthog-js/react"
import { useRef } from "react"
import { useAuth } from "~/lib/auth"

export function usePostHogIdentify() {
	const posthog = usePostHog()
	const { user } = useAuth()
	const previousUserIdRef = useRef<string | null>(null)

	// posthog.identify / .reset are pure external side effects — fire once per
	// user transition from the render body with a ref guard.
	if (user && user.id !== previousUserIdRef.current) {
		previousUserIdRef.current = user.id
		posthog.identify(user.id, {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			organizationId: user.organizationId,
			role: user.role,
		})
	} else if (!user && previousUserIdRef.current) {
		previousUserIdRef.current = null
		posthog.reset()
	}
}
