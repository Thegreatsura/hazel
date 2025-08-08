import { convexQuery } from "@convex-dev/react-query"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/")({
	component: RouteComponent,
})

function RouteComponent() {
	const organizationQuery = useQuery(convexQuery(api.me.getOrganization, {}))

	if (organizationQuery.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2"></div>
			</div>
		)
	}

	if (organizationQuery.data?.directive === "success") {
		const orgId = organizationQuery.data.data._id
		return <Navigate to="/$orgId" params={{ orgId }} />
	}

	if (organizationQuery.data?.directive === "redirect") {
		if (organizationQuery.data.to === "/auth/login") {
			return <Navigate to="/auth/login" search={{ returnTo: "/app" }} />
		}
		return <Navigate to={(organizationQuery.data as any).to as any} />
	}

	// Redirect to onboarding if user has no organization
	return <Navigate to="/onboarding" />
}
