import { BaseBlockquotePlugin } from "@platejs/basic-nodes"
import { BaseParagraphPlugin } from "platejs"
import { BlockquoteElementStatic } from "~/components/editor/static-ui/blockquote-node-static"
import {
	H1ElementStatic,
	H2ElementStatic,
	H3ElementStatic,
	H4ElementStatic,
	H5ElementStatic,
	H6ElementStatic,
} from "~/components/editor/static-ui/heading-node-static"
import { ParagraphElementStatic } from "~/components/editor/static-ui/paragraph-node-static"

export const BasicBlocksKitStatic = [
	BaseParagraphPlugin.configure({
		node: { component: ParagraphElementStatic },
	}),
	BaseBlockquotePlugin.configure({
		node: { component: BlockquoteElementStatic },
	}),
]
