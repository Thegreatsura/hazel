import { type Accessor, type JSX, splitProps } from "solid-js"
import { MarkdownInput } from "./markdown-input"

export interface ChatInputProps extends JSX.HTMLAttributes<HTMLDivElement> {
	value: Accessor<string>
	onValueChange: (value: string) => void
}

export const ChatInput = (props: ChatInputProps) => {
	const [baseProps, divProps] = splitProps(props, ["class", "value", "onValueChange"])
	return (
		<MarkdownInput
			class="w-full py-3 outline-none"
			value={baseProps.value}
			onValueChange={baseProps.onValueChange}
			renderers={{
				header1: (token) => <h1 class="font-bold text-2xl">{token.content}</h1>,
				bold: (token) => <strong class="font-bold">{token.content}</strong>,
				codeblock: (token) => <pre class="rounded bg-muted p-2">{token.content}</pre>,
				highlight: (token) => <mark class="bg-yellow-200">{token.content.replace(/==/g, "")}</mark>,
				callout: (token) => <div class="border-blue-500 border-l-4 bg-blue-50 pl-2">{token.content}</div>,
				default: (token) => <span>{token.content}</span>,
			}}
			{...divProps}
		/>
	)
}
