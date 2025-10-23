import type { SlateLeafProps } from "platejs/static"

export function HighlightLeafStatic(props: SlateLeafProps) {
	return <mark className="bg-highlight/30 text-inherit">{props.children}</mark>
}
