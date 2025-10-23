import {
	BaseBoldPlugin,
	BaseCodePlugin,
	BaseHighlightPlugin,
	BaseItalicPlugin,
	BaseKbdPlugin,
	BaseStrikethroughPlugin,
	BaseSubscriptPlugin,
	BaseSuperscriptPlugin,
	BaseUnderlinePlugin,
} from "@platejs/basic-nodes"

import { CodeLeafStatic } from "~/components/editor/static-ui/code-node-static"
import { HighlightLeafStatic } from "~/components/editor/static-ui/highlight-node-static"
import { KbdLeafStatic } from "~/components/editor/static-ui/kbd-node-static"
import { BaseListKit } from "./list-base-kit"

export const BasicMarksKitStatic = [
	BaseBoldPlugin,
	BaseItalicPlugin,
	BaseUnderlinePlugin,
	BaseCodePlugin.configure({
		node: { component: CodeLeafStatic },
	}),
	BaseStrikethroughPlugin,
	BaseSubscriptPlugin,
	BaseSuperscriptPlugin,
	BaseHighlightPlugin.configure({
		node: { component: HighlightLeafStatic },
	}),
	BaseKbdPlugin.configure({
		node: { component: KbdLeafStatic },
	}),

	...BaseListKit,
]
