import type { SlateElementProps } from "platejs/static"

export function ParagraphElementStatic(props: SlateElementProps) {
	return <p className="m-0 px-0 py-1">{props.children}</p>
}
