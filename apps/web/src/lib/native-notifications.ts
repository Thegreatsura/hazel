/**
 * @module Native notification handling
 * @platform desktop
 * @description Send system-level notifications via Tauri notification plugin
 */

type NotificationApi = typeof import("@tauri-apps/plugin-notification")

const notification: NotificationApi | undefined = (window as any).__TAURI__?.notification

export async function initNativeNotifications(): Promise<boolean> {
	if (!notification) return false

	let granted = await notification.isPermissionGranted()
	if (!granted) {
		const permission = await notification.requestPermission()
		granted = permission === "granted"
	}
	return granted
}

export async function sendNativeNotification(title: string, body: string) {
	if (document.hasFocus()) return
	if (!notification) return

	const granted = await notification.isPermissionGranted()
	if (granted) {
		try {
			notification.sendNotification({ title, body })
		} catch (error) {
			console.error("[native-notifications] Failed to send notification:", error)
		}
	}
}
