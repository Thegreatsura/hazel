import { cva, type VariantProps } from "class-variance-authority"
import type { SlateElementProps } from "platejs/static"

const headingVariants = cva("relative mb-1", {
	variants: {
		variant: {
			h1: "mt-[1.6em] pb-1 font-heading text-4xl font-bold",
			h2: "mt-[1.4em] pb-px font-heading text-2xl font-semibold tracking-tight",
			h3: "mt-[1em] pb-px font-heading text-xl font-semibold tracking-tight",
			h4: "mt-[0.75em] font-heading text-lg font-semibold tracking-tight",
			h5: "mt-[0.75em] text-lg font-semibold tracking-tight",
			h6: "mt-[0.75em] text-base font-semibold tracking-tight",
		},
	},
})

function HeadingElementStatic({
	variant = "h1",
	...props
}: SlateElementProps & VariantProps<typeof headingVariants>) {
	const Component = variant as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
	return <Component className={headingVariants({ variant })}>{props.children}</Component>
}

export function H1ElementStatic(props: SlateElementProps) {
	return <HeadingElementStatic variant="h1" {...props} />
}

export function H2ElementStatic(props: SlateElementProps) {
	return <HeadingElementStatic variant="h2" {...props} />
}

export function H3ElementStatic(props: SlateElementProps) {
	return <HeadingElementStatic variant="h3" {...props} />
}

export function H4ElementStatic(props: SlateElementProps) {
	return <HeadingElementStatic variant="h4" {...props} />
}

export function H5ElementStatic(props: SlateElementProps) {
	return <HeadingElementStatic variant="h5" {...props} />
}

export function H6ElementStatic(props: SlateElementProps) {
	return <HeadingElementStatic variant="h6" {...props} />
}
