import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useAuth } from "@workos-inc/authkit-react"
import { useEffect } from "react"

export const Route = createFileRoute("/login")({
	component: LoginPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			returnTo: search.returnTo as string | undefined,
		}
	},
})

function LoginPage() {
	const { user, signIn, isLoading } = useAuth()
	const search = Route.useSearch()

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search)
		const context = searchParams.get("context") ?? undefined

		if (!user && !isLoading) {
			signIn({
				context,
				state: { returnTo: search.returnTo || "/" },
			})
		}
	}, [user, isLoading, signIn, search])

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2"></div>
			</div>
		)
	}

	if (user) {
		return <Navigate to={search.returnTo || "/"} />
	}

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="mb-4 font-semibold text-2xl">Redirecting to login...</h1>
				<div className="mx-auto h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2"></div>
			</div>
		</div>
	)
}
