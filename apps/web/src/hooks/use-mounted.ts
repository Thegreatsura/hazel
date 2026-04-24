import { useState } from "react"
import { useMountEffect } from "~/hooks/use-mount-effect"

export function useMounted() {
	const [mounted, setMounted] = useState(false)

	useMountEffect(() => {
		setMounted(true)
	})

	return mounted
}
