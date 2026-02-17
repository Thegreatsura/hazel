import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from "react"

interface MessageHoverState {
	hoveredMessageId: string | null
	targetRef: HTMLDivElement | null
}

interface MessageHoverMeta {
	isToolbarMenuOpen: boolean
	isToolbarHovered: boolean
}

type SetHovered = (messageId: string | null, ref: HTMLDivElement | null) => void

interface MessageHoverActions {
	setHovered: (messageId: string | null, ref: HTMLDivElement | null) => void
	setToolbarMenuOpen: (open: boolean) => void
	setToolbarHovered: (hovered: boolean) => void
	clearHover: () => void
}

interface MessageHoverContextValue {
	state: MessageHoverState
	actions: MessageHoverActions
	meta: MessageHoverMeta
}

const MessageHoverContext = createContext<MessageHoverContextValue | null>(null)

export function useMessageHover() {
	const context = React.use(MessageHoverContext)
	if (!context) {
		throw new Error("useMessageHover must be used within a MessageHoverProvider")
	}
	return context
}

// eslint-disable-next-line react-refresh/only-export-components
import React from "react"

interface MessageHoverProviderProps {
	children: ReactNode
	/**
	 * Delay in ms before hiding the toolbar after mouse leaves the message.
	 * This allows users to move to the toolbar without it disappearing.
	 * @default 200
	 */
	hideDelay?: number
}

export function MessageHoverProvider({ children, hideDelay = 200 }: MessageHoverProviderProps) {
	const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
	const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false)
	const [targetElement, setTargetElement] = useState<HTMLDivElement | null>(null)
	const [isToolbarHovered, setIsToolbarHoveredState] = useState(false)
	const hideTimeoutRef = useRef<number | null>(null)

	const clearHideTimeout = useCallback(() => {
		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current)
			hideTimeoutRef.current = null
		}
	}, [])

	const setHovered: SetHovered = useCallback(
		(messageId: string | null, ref: HTMLDivElement | null) => {
			if (messageId) {
				clearHideTimeout()
				setHoveredMessageId(messageId)
				setTargetElement(ref)
			} else if (!isToolbarMenuOpen && !isToolbarHovered) {
				hideTimeoutRef.current = window.setTimeout(() => {
					setHoveredMessageId(null)
					setTargetElement(null)
					hideTimeoutRef.current = null
				}, hideDelay)
			}
		},
		[isToolbarMenuOpen, isToolbarHovered, hideDelay, clearHideTimeout],
	)

	const setToolbarMenuOpen = useCallback((open: boolean) => {
		setIsToolbarMenuOpen(open)
	}, [])

	const setToolbarHovered = useCallback(
		(hovered: boolean) => {
			setIsToolbarHoveredState(hovered)
			if (hovered) {
				clearHideTimeout()
			}
		},
		[clearHideTimeout],
	)

	const clearHover = useCallback(() => {
		clearHideTimeout()
		setHoveredMessageId(null)
		setTargetElement(null)
	}, [clearHideTimeout])

	const contextValue = useMemo<MessageHoverContextValue>(
		() => ({
			state: {
				hoveredMessageId,
				targetRef: targetElement,
			},
			actions: {
				setHovered,
				setToolbarMenuOpen,
				setToolbarHovered,
				clearHover,
			},
			meta: {
				isToolbarMenuOpen,
				isToolbarHovered,
			},
		}),
		[
			hoveredMessageId,
			targetElement,
			isToolbarMenuOpen,
			isToolbarHovered,
			setHovered,
			setToolbarMenuOpen,
			setToolbarHovered,
			clearHover,
		],
	)

	return <MessageHoverContext value={contextValue}>{children}</MessageHoverContext>
}
