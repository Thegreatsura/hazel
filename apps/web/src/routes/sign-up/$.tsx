import { SignUp } from "@clerk/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-up/$")({
	component: SignUpPage,
	validateSearch: (s: Record<string, unknown>) => ({
		redirect_url: typeof s.redirect_url === "string" ? s.redirect_url : undefined,
	}),
})

function SignUpPage() {
	const { redirect_url } = Route.useSearch()
	return (
		<div className="flex min-h-dvh items-center justify-center p-6">
			<SignUp
				routing="path"
				path="/sign-up"
				signInUrl="/sign-in"
				fallbackRedirectUrl={redirect_url ?? "/"}
				signInFallbackRedirectUrl={redirect_url ?? "/"}
			/>
		</div>
	)
}
