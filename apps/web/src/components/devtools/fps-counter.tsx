import { type Component, createSignal, onCleanup, onMount } from "solid-js"

export const FpsCounter: Component = () => {
	// Signal to store and display the FPS value
	const [fps, setFps] = createSignal<number>(0)

	let frameCount = 0
	let lastTime: number = performance.now()
	let animationFrameId: number | undefined // Can be undefined initially

	// The core loop function that runs on each frame
	const loop = (currentTime: DOMHighResTimeStamp) => {
		frameCount++
		const elapsedTime: number = currentTime - lastTime

		// Update the FPS display roughly every second
		if (elapsedTime >= 1000) {
			// Calculate FPS: (frames / time_in_seconds)
			const calculatedFps: number = Math.round((frameCount * 1000) / elapsedTime)
			setFps(calculatedFps)

			// Reset counter and timer for the next interval
			frameCount = 0
			lastTime = currentTime
		}

		// Request the next frame
		animationFrameId = requestAnimationFrame(loop)
	}

	// Start the loop when the component mounts
	onMount(() => {
		// Initialize timer and start the loop
		lastTime = performance.now()
		frameCount = 0 // Reset count just before starting
		animationFrameId = requestAnimationFrame(loop)
	})

	// Stop the loop when the component unmounts to prevent memory leaks
	onCleanup(() => {
		if (animationFrameId !== undefined) {
			cancelAnimationFrame(animationFrameId)
		}
	})

	// Render the FPS value
	return (
		<div
			style={{
				position: "fixed",
				top: "10px",
				right: "10px",
				"background-color": "rgba(0, 0, 0, 0.7)",
				color: "lime",
				padding: "5px 10px",
				"border-radius": "3px",
				"font-family": "monospace",
				"z-index": "9999", // Ensure it's on top
			}}
		>
			FPS: {fps()}
		</div>
	)
}
