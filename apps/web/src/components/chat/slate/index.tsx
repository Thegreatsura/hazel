import markdown from "highlight.js/lib/languages/markdown"
import { lowlight } from "lowlight/lib/core"
import React, { useCallback, useMemo } from "react"
import { createEditor, type Descendant, type NodeEntry, type Range, Text } from "slate"
import { withHistory } from "slate-history"
import { Editable, type RenderLeafProps, Slate, withReact } from "slate-react"
import type { CustomEditor } from "./custom-types.d"

// Register markdown language
lowlight.registerLanguage("markdown", markdown)

const _MarkdownPreviewExample = () => {
	const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])

	const editor = useMemo(() => withHistory(withReact(createEditor())) as CustomEditor, [])

	const decorate = useCallback(([node, path]: NodeEntry) => {
		const ranges: Range[] = []

		if (!Text.isText(node)) {
			return ranges
		}

		const tokens = lowlight.highlight("markdown", node.text).children
		let start = 0

		const getLength = (token: any): number => {
			if (typeof token.value === "string") {
				return token.value.length
			} else if (Array.isArray(token.children)) {
				return token.children.reduce((l, t) => l + getLength(t), 0)
			}
			return 0
		}

		for (const token of tokens) {
			const length = getLength(token)
			const end = start + length

			if (token.type) {
				ranges.push({
					[token.type]: true,
					anchor: { path, offset: start },
					focus: { path, offset: end },
				})
			}

			start = end
		}

		return ranges
	}, [])

	return (
		<Slate editor={editor} initialValue={initialValue}>
			<Editable
				decorate={decorate}
				renderLeaf={renderLeaf}
				placeholder="Write some markdown..."
				className="rounded-md border p-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
		</Slate>
	)
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
	let className = ""

	if (leaf.bold) className += " font-bold"
	if (leaf.italic) className += " italic"
	if (leaf.underlined) className += " underline"
	if (leaf.title) className += " block font-bold text-xl my-5"
	if (leaf.list) className += " pl-3 text-lg leading-3"
	if (leaf.hr) className += " block text-center border-b-2 border-gray-300"
	if (leaf.blockquote) className += " block border-l-2 border-gray-300 pl-3 text-gray-500 italic"
	if (leaf.code) className += " font-mono bg-gray-200 px-1 py-0.5 rounded text-sm"

	return (
		<span {...attributes} className={className}>
			{children}
		</span>
	)
}

const initialValue: Descendant[] = [
	{
		type: "paragraph",
		children: [
			{
				text: "Slate is flexible enough to add **decorations** that can format text based on its content. For example, this editor has **Markdown** preview decorations on it, to make it _dead_ simple to make an editor with built-in Markdown previewing.",
			},
		],
	},
	{
		type: "paragraph",
		children: [{ text: "## Try it out!" }],
	},
	{
		type: "paragraph",
		children: [{ text: "Try it out for yourself!" }],
	},
]
