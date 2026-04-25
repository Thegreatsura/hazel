import { useRef } from "react"
import { toast } from "sonner"
import { useRegisterSW } from "virtual:pwa-register/react"

/**
 * Component that monitors for new app versions and displays a toast notification
 * when an update is available, prompting the user to reload the page.
 *
 * Features:
 * - Checks for updates every 60 seconds via service worker
 * - Shows toast when a new version is detected
 * - Properly activates new service worker before reloading
 * - Gracefully handles offline scenarios
 */
export const VersionCheck = () => {
	// `updateServiceWorker` is returned by useRegisterSW but referenced from
	// onNeedRefresh (which is constructed in the same call). Route it through
	// a ref so the action handler always reads the latest value.
	const updateServiceWorkerRef = useRef<((reload?: boolean) => Promise<void>) | undefined>(undefined)

	const { updateServiceWorker } = useRegisterSW({
		onRegisteredSW(_swUrl, registration) {
			// Check for updates every 60 seconds
			if (registration) {
				setInterval(() => {
					registration.update()
				}, 60 * 1000)
			}
		},
		onNeedRefresh() {
			toast("A new version is available", {
				id: "version-update",
				description: "Reload the page to get the latest updates",
				duration: Number.POSITIVE_INFINITY,
				action: {
					label: "Reload",
					onClick: () => {
						// This activates the new SW and reloads
						void updateServiceWorkerRef.current?.(true)
					},
				},
				cancel: {
					label: "Dismiss",
					onClick: () => {},
				},
			})
		},
	})

	updateServiceWorkerRef.current = updateServiceWorker

	return null
}
