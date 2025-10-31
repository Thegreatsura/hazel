import { useAtomSet } from "@effect-atom/atom-react"
import type { OrganizationId } from "@hazel/db/schema"
import { eq, useLiveQuery } from "@tanstack/react-db"
import { createFileRoute, Navigate, useNavigate, useSearch } from "@tanstack/react-router"
import { Building02 } from "@untitledui/icons"
import { type } from "arktype"
import { Cause, Chunk, Exit, Option } from "effect"
import { useCallback, useEffect } from "react"
import { setOrganizationSlugMutation } from "~/atoms/organization-atoms"
import { Button } from "~/components/base/buttons/button"
import { FeaturedIcon } from "~/components/foundations/featured-icon/featured-icons"
import { BackgroundPattern } from "~/components/shared-assets/background-patterns"
import { organizationCollection } from "~/db/collections"
import { useAppForm } from "~/hooks/use-app-form"
import { toastExit } from "~/lib/toast-exit"

const setupSchema = type({
	slug: "3 <= string < 50",
})

type SetupFormData = typeof setupSchema.infer

export const Route = createFileRoute("/_app/onboarding/setup-organization")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			orgId: (search.orgId as string) || undefined,
		}
	},
})

function RouteComponent() {
	const search = useSearch({ from: "/_app/onboarding/setup-organization" })
	const navigate = useNavigate()

	const { data: organizations } = useLiveQuery(
		(q) =>
			search.orgId
				? q
						.from({ org: organizationCollection })
						.where(({ org }) => eq(org.id, search.orgId as OrganizationId))
						.orderBy(({ org }) => org.createdAt, "asc")
						.limit(1)
				: null,
		[search.orgId],
	)

	const organization = organizations?.[0]

	const setOrganizationSlug = useAtomSet(setOrganizationSlugMutation, {
		mode: "promiseExit",
	})

	const generateSlug = useCallback((name: string) => {
		let slug = name
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.substring(0, 50)

		if (slug.length < 3) {
			slug = slug.padEnd(3, "0")
		}

		return slug
	}, [])

	const form = useAppForm({
		defaultValues: {
			slug: "",
		} as SetupFormData,
		validators: {
			onChange: setupSchema,
		},
		onSubmit: async ({ value }) => {
			if (!organization) return

			const exit = await toastExit(
				setOrganizationSlug({
					payload: {
						id: organization.id,
						slug: value.slug.trim(),
					},
				}),
				{
					loading: "Setting up organization...",
					success: () => {
						// Navigate on success
						navigate({ to: "/$orgSlug", params: { orgSlug: value.slug.trim() } })
						return "Organization setup complete!"
					},
				},
			)

			// Handle errors by setting field-level errors
			if (Exit.isFailure(exit)) {
				const failures = Cause.failures(exit.cause)
				const firstFailureOption = Chunk.head(failures)

				// Extract error message from the first failure
				let errorMessage = "Failed to update organization"
				if (Option.isSome(firstFailureOption)) {
					const firstFailure = firstFailureOption.value
					if (
						typeof firstFailure === "object" &&
						firstFailure !== null &&
						"message" in firstFailure
					) {
						errorMessage = String(firstFailure.message)
					}
				}

				form.setFieldMeta("slug", (meta) => ({
					...meta,
					errors: [{ message: errorMessage }],
				}))
			}

			return exit
		},
	})

	useEffect(() => {
		if (organization?.name && !form.getFieldValue("slug")) {
			form.setFieldValue("slug", generateSlug(organization.name))
		}
	}, [organization?.name, form, generateSlug])

	if (!search.orgId) {
		return <Navigate to="/onboarding" />
	}

	if (organization?.slug) {
		return <Navigate to="/$orgSlug" params={{ orgSlug: organization.slug }} />
	}

	if (!organization) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2"></div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-130">
				<div className="relative overflow-hidden rounded-2xl bg-primary shadow-xl">
					<div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
						<div className="relative w-max">
							<FeaturedIcon color="gray" size="lg" theme="modern" icon={Building02} />
							<BackgroundPattern
								pattern="circle"
								size="sm"
								className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
							/>
						</div>
						<div className="z-10 flex flex-col gap-0.5">
							<h1 className="font-semibold text-md text-primary">Setup Your Organization</h1>
							<p className="text-sm text-tertiary">
								Configure a URL slug for <strong>{organization.name}</strong>
							</p>
						</div>
					</div>

					<div className="h-5 w-full" />

					<div className="flex flex-col gap-4 px-4 sm:px-6">
						{/* Slug Field */}
						<form.AppField
							name="slug"
							children={(field) => (
								<div className="flex flex-col gap-1.5">
									<field.Input
										label="Organization URL"
										size="md"
										placeholder="my-organization"
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										onBlur={field.handleBlur}
										isInvalid={!!field.state.meta.errors?.length}
										hint={field.state.meta.errors
											?.map((error) => error?.message)
											.join(", ")}
										autoFocus
									/>
									{!field.state.meta.errors?.length && field.state.value && (
										<p className="text-tertiary text-xs">
											Your organization URL will be:{" "}
											<span className="font-medium text-primary">
												/{field.state.value}
											</span>
										</p>
									)}
								</div>
							)}
						/>
					</div>

					<div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:px-6 sm:pt-8 sm:pb-6">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button
									color="primary"
									size="lg"
									onClick={form.handleSubmit}
									isDisabled={!canSubmit || isSubmitting}
								>
									{isSubmitting ? "Completing Setup..." : "Complete Setup"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</div>
			</div>
		</div>
	)
}
