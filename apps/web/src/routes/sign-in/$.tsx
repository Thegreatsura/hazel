import { SignIn } from "@clerk/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-in/$")({
	component: SignInPage,
	validateSearch: (s: Record<string, unknown>) => ({
		redirect_url: typeof s.redirect_url === "string" ? s.redirect_url : undefined,
	}),
})

function SignInPage() {
	const { redirect_url } = Route.useSearch()
	return (
		<div className="flex min-h-dvh items-center justify-center p-6">
			<SignIn
				routing="path"
				path="/sign-in"
				signUpUrl="/sign-up"
				fallbackRedirectUrl={redirect_url ?? "/"}
				signUpFallbackRedirectUrl={redirect_url ?? "/"}
			/>
		</div>
	)
}
