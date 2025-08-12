import {
	RealtimeKitProvider,
	useRealtimeKitClient,
	useRealtimeKitMeeting,
} from "@cloudflare/realtimekit-react"
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_app/$orgId/call")({
	component: RouteComponent,
})

function RouteComponent() {
	const [meeting, initMeeting] = useRealtimeKitClient()

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		initMeeting({
			authToken: "99af80ac6c0bb0ba5147",
			defaults: {
				audio: false,
				video: false,
			},
		})
	}, [])

	return (
		<RealtimeKitProvider value={meeting}>
			<MyMeetingUI />
		</RealtimeKitProvider>
	)
}

function MyMeetingUI() {
	const { meeting } = useRealtimeKitMeeting()
	return (
		<div style={{ height: "480px" }}>
			<RtkMeeting mode="fill" meeting={meeting} showSetupScreen={false} />
		</div>
	)
}
