import { tv } from "tailwind-variants"

const focusRing = tv({
	variants: {
		isFocused: { true: "outline-hidden ring-4 ring-ring/20 data-invalid:ring-danger/20" },
		isFocusVisible: { true: "outline-hidden ring-4 ring-ring/20" },
		isInvalid: { true: "ring-4 ring-danger/20" },
	},
})

const focusStyles = tv({
	extend: focusRing,
	variants: {
		isFocused: { true: "border-ring/70 forced-colors:border-[Highlight]" },
		isInvalid: { true: "border-danger/70 forced-colors:border-[Mark]" },
	},
})

export { focusRing, focusStyles }
