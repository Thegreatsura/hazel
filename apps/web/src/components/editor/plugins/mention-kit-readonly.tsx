"use client"

import { MentionPlugin } from "@platejs/mention/react"

import { MentionElement } from "~/components/editor/editor-ui/mention-node"

export const MentionKitReadonly = [
	MentionPlugin.configure({
		options: {
			trigger: "@",
			triggerPreviousCharPattern: /^$|^[\s"']$/,
			insertSpaceAfterMention: false,
		},
	}).withComponent(MentionElement),
	// Note: MentionInputPlugin is intentionally excluded for readonly mode
	// to prevent "Plate hooks must be used inside a Plate or PlateController" error
]
