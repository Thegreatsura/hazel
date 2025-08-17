"use client"

import { createSlatePlugin, type Decorate, type RenderLeafProps, TextApi, type TText } from "platejs"
import { Plate, usePlateEditor } from "platejs/react"
import Prism from "prismjs"
import { BasicNodesKit } from "~/components/editor/plugins/basic-nodes-kit"
import { Editor, EditorContainer } from "~/components/ui/editor"
import { cn } from "~/lib/utils"

import "prismjs/components/prism-markdown.js"

/** Decorate texts with markdown preview. */
const decoratePreview: Decorate = ({ entry: [node, path] }) => {
	const ranges: any[] = []

	if (!TextApi.isText(node)) {
		return ranges
	}

	const getLength = (token: any) => {
		if (typeof token === "string") {
			return token.length
		}
		if (typeof token.content === "string") {
			return token.content.length
		}

		return token.content.reduce((l: any, t: any) => l + getLength(t), 0)
	}

	const tokens = Prism.tokenize(node.text, Prism.languages.markdown)
	let start = 0

	for (const token of tokens) {
		const length = getLength(token)
		const end = start + length

		if (typeof token !== "string") {
			ranges.push({
				anchor: { offset: start, path },
				focus: { offset: end, path },
				[token.type]: true,
			})
		}

		start = end
	}

	return ranges
}

function PreviewLeaf({
	attributes,
	children,
	leaf,
}: RenderLeafProps<
	{
		blockquote?: boolean
		bold?: boolean
		code?: boolean
		hr?: boolean
		italic?: boolean
		list?: boolean
		title?: boolean
	} & TText
>) {
	const { blockquote, bold, code, hr, italic, list, title } = leaf

	return (
		<span
			{...attributes}
			className={cn(
				bold && "font-bold",
				italic && "italic",
				title && "mx-0 mt-5 mb-2.5 inline-block font-bold text-[20px]",
				list && "pl-2.5 text-[20px] leading-[10px]",
				hr && "block border-[#ddd] border-b-2 text-center",
				blockquote && "inline-block border-[#ddd] border-l-2 pl-2.5 text-[#aaa] italic",
				code && "bg-[#eee] p-[3px] font-mono",
			)}
		>
			{children}
		</span>
	)
}

export function PreviewMdDemo() {
	const editor = usePlateEditor(
		{
			plugins: [
				...BasicNodesKit,
				createSlatePlugin({
					key: "preview-markdown",
					decorate: decoratePreview,
				}),
			],
		},
		[],
	)

	return (
		<Plate editor={editor}>
			<EditorContainer>
				<Editor
					variant="chat"
					className="border border-primary bg-primary"
					renderLeaf={PreviewLeaf}
					placeholder="Write something..."
				/>
			</EditorContainer>
		</Plate>
	)
}
