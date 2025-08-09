import { useCallback, useEffect, useRef, useState } from "react"

interface NotificationSoundSettings {
	enabled: boolean
	volume: number
	soundFile: "notification01" | "notification02"
	cooldownMs: number
}

const DEFAULT_SETTINGS: NotificationSoundSettings = {
	enabled: true,
	volume: 0.5,
	soundFile: "notification01",
	cooldownMs: 2000, // Prevent sound spam - min 2 seconds between sounds
}

const STORAGE_KEY = "notification-sound-settings"

export function useNotificationSound() {
	const [settings, setSettings] = useState<NotificationSoundSettings>(() => {
		if (typeof window === "undefined") return DEFAULT_SETTINGS

		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			try {
				return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
			} catch {
				return DEFAULT_SETTINGS
			}
		}
		return DEFAULT_SETTINGS
	})

	const audioRef = useRef<HTMLAudioElement | null>(null)
	const lastPlayedRef = useRef<number>(0)
	const isPlayingRef = useRef<boolean>(false)

	// Initialize or update audio element when sound file changes
	useEffect(() => {
		if (typeof window === "undefined") return

		// Only create new audio element if file changed or doesn't exist
		if (!audioRef.current || audioRef.current.src !== `${window.location.origin}/sounds/${settings.soundFile}.mp3`) {
			if (audioRef.current) {
				audioRef.current.pause()
			}
			const audio = new Audio(`/sounds/${settings.soundFile}.mp3`)
			audioRef.current = audio
		}

		// Cleanup
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current = null
			}
		}
	}, [settings.soundFile])

	// Update volume separately to avoid recreating audio element
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = settings.volume
		}
	}, [settings.volume])

	// Save settings to localStorage
	useEffect(() => {
		if (typeof window === "undefined") return
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
	}, [settings])

	const playSound = useCallback(async () => {
		if (!settings.enabled || !audioRef.current) return

		// Check cooldown
		const now = Date.now()
		if (now - lastPlayedRef.current < settings.cooldownMs) {
			return
		}

		// Prevent overlapping sounds
		if (isPlayingRef.current) return

		try {
			isPlayingRef.current = true
			lastPlayedRef.current = now

			// Reset and play
			audioRef.current.currentTime = 0
			await audioRef.current.play()
		} catch (error) {
			// Handle autoplay policy restrictions
			console.warn("Failed to play notification sound:", error)
		} finally {
			isPlayingRef.current = false
		}
	}, [settings.enabled, settings.cooldownMs])

	const updateSettings = useCallback((updates: Partial<NotificationSoundSettings>) => {
		setSettings((prev) => ({ ...prev, ...updates }))
	}, [])

	const testSound = useCallback(async () => {
		if (!audioRef.current) return

		try {
			audioRef.current.currentTime = 0
			await audioRef.current.play()
		} catch (error) {
			console.warn("Failed to play test sound:", error)
		}
	}, [])

	return {
		settings,
		updateSettings,
		playSound,
		testSound,
	}
}
