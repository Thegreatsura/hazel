import { createFileRoute } from "@tanstack/react-router"
import { Settings03 } from "@/pages/settings-03"

export const Route = createFileRoute("/_app/settings/")({
	component: RouteComponent,
})

function RouteComponent() {
	return <Settings03 />
}
