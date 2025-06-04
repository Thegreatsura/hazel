export type { Message } from "../types"

const KEY_PREFIX = "chatMessages:"

function getKey(serverId: string, channelId: string) {
	return `${KEY_PREFIX}${serverId}:${channelId}`
}

export function loadCachedMessages(serverId: string, channelId: string): Message[] | null {
	try {
		const raw = localStorage.getItem(getKey(serverId, channelId))
		if (!raw) return null
		return JSON.parse(raw) as Message[]
	} catch {
		return null
	}
}

export function saveCachedMessages(serverId: string, channelId: string, messages: Message[]): void {
	try {
		localStorage.setItem(getKey(serverId, channelId), JSON.stringify(messages))
	} catch {
		// ignore write errors
	}
}
