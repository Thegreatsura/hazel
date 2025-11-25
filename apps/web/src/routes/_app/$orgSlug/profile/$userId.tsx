import { Result, useAtomValue } from "@effect-atom/atom-react"
import type { UserId } from "@hazel/schema"
import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { toast } from "sonner"
import { userWithPresenceAtomFamily } from "~/atoms/message-atoms"
import IconEnvelope from "~/components/icons/icon-envelope"
import { Avatar } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { FieldError, Label } from "~/components/ui/field"
import { Input, InputGroup } from "~/components/ui/input"
import { SectionHeader } from "~/components/ui/section-header"
import { SectionLabel } from "~/components/ui/section-label"
import { TextField } from "~/components/ui/text-field"
import { userCollection } from "~/db/collections"
import { useAppForm } from "~/hooks/use-app-form"
import { useAuth } from "~/lib/auth"
import { cn } from "~/lib/utils"

export const Route = createFileRoute("/_app/$orgSlug/profile/$userId")({
	component: ProfilePage,
})

const profileSchema = type({
	firstName: "string > 0",
	lastName: "string > 0",
})

type ProfileFormData = typeof profileSchema.infer

function ProfilePage() {
	const { userId } = Route.useParams()
	const { user: currentUser } = useAuth()

	const userPresenceResult = useAtomValue(userWithPresenceAtomFamily(userId as UserId))
	const data = Result.getOrElse(userPresenceResult, () => [])
	const result = data[0]
	const user = result?.user
	const presence = result?.presence

	const isOwnProfile = currentUser?.id === userId

	const form = useAppForm({
		defaultValues: {
			firstName: user?.firstName || "",
			lastName: user?.lastName || "",
		} as ProfileFormData,
		validators: {
			onChange: profileSchema,
		},
		onSubmit: async ({ value }) => {
			if (!currentUser || !isOwnProfile) return
			try {
				const tx = userCollection.update(currentUser.id, (draft) => {
					draft.firstName = value.firstName
					draft.lastName = value.lastName
				})
				await tx.isPersisted.promise
				toast.success("Profile updated successfully")
			} catch (error) {
				console.error("Error updating profile:", error)
				toast.error("Failed to update profile")
			}
		},
	})

	const getStatusColor = (status?: string) => {
		switch (status) {
			case "online":
				return "text-success bg-success"
			case "away":
			case "busy":
				return "text-warning bg-warning"
			case "dnd":
				return "text-danger bg-danger"
			default:
				return "text-muted-fg bg-muted"
		}
	}

	const getStatusLabel = (status?: string) => {
		if (!status) return "Offline"
		return status.charAt(0).toUpperCase() + status.slice(1)
	}

	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-fg">User not found</p>
			</div>
		)
	}

	const fullName = `${user.firstName} ${user.lastName}`

	// View mode - read-only profile display
	if (!isOwnProfile) {
		return (
			<div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
				<SectionHeader.Root>
					<SectionHeader.Group>
						<div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
							<SectionHeader.Heading>Profile</SectionHeader.Heading>
							<SectionHeader.Subheading>
								View {user.firstName}'s profile information.
							</SectionHeader.Subheading>
						</div>
					</SectionHeader.Group>
				</SectionHeader.Root>

				<div className="max-w-xl space-y-6">
					<div className="flex items-center gap-4">
						<div className="relative">
							<Avatar size="xl" alt={fullName} src={user.avatarUrl} />
							{presence?.status && (
								<span
									className={cn(
										"absolute right-0 bottom-0 size-3 rounded-full border-2 border-bg",
										getStatusColor(presence.status),
									)}
								/>
							)}
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-semibold text-fg text-lg">{fullName}</span>
							{presence?.status && (
								<span
									className={cn(
										"inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
										getStatusColor(presence.status),
									)}
								>
									<span className="size-1.5 rounded-full bg-current" />
									{getStatusLabel(presence.status)}
								</span>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<SectionLabel.Root size="sm" title="Email address" />
						<TextField isDisabled>
							<InputGroup>
								<IconEnvelope data-slot="icon" />
								<Input type="email" value={user.email} />
							</InputGroup>
						</TextField>
					</div>
				</div>
			</div>
		)
	}

	// Edit mode - editable form for own profile
	return (
		<form
			key={userId}
			className="flex flex-col gap-6 px-4 py-6 lg:px-8"
			onSubmit={(e) => {
				e.preventDefault()
				form.handleSubmit()
			}}
		>
			<SectionHeader.Root>
				<SectionHeader.Group>
					<div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
						<SectionHeader.Heading>Profile</SectionHeader.Heading>
						<SectionHeader.Subheading>
							Manage your profile information and preferences.
						</SectionHeader.Subheading>
					</div>
				</SectionHeader.Group>
			</SectionHeader.Root>

			<div className="max-w-xl space-y-6">
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar size="xl" alt={fullName} src={user.avatarUrl} />
						{presence?.status && (
							<span
								className={cn(
									"absolute right-0 bottom-0 size-3 rounded-full border-2 border-bg",
									getStatusColor(presence.status),
								)}
							/>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<span className="font-semibold text-fg text-lg">{fullName}</span>
						{presence?.status && (
							<span
								className={cn(
									"inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
									getStatusColor(presence.status),
								)}
							>
								<span className="size-1.5 rounded-full bg-current" />
								{getStatusLabel(presence.status)}
							</span>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<SectionLabel.Root isRequired size="sm" title="Name" className="max-lg:hidden" />

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-4">
						<form.AppField
							name="firstName"
							children={(field) => (
								<field.TextField
									isRequired
									name="firstName"
									value={field.state.value}
									onChange={(value) => field.handleChange(value)}
									onBlur={field.handleBlur}
									isInvalid={!!field.state.meta.errors?.length}
								>
									<Label className="lg:hidden">First name</Label>
									<Input />
									{field.state.meta.errors?.length > 0 && (
										<FieldError>
											{field.state.meta.errors[0]?.message || "First name is required"}
										</FieldError>
									)}
								</field.TextField>
							)}
						/>
						<form.AppField
							name="lastName"
							children={(field) => (
								<field.TextField
									isRequired
									name="lastName"
									value={field.state.value}
									onChange={(value) => field.handleChange(value)}
									onBlur={field.handleBlur}
									isInvalid={!!field.state.meta.errors?.length}
								>
									<Label className="lg:hidden">Last name</Label>
									<Input />
									{field.state.meta.errors?.length > 0 && (
										<FieldError>
											{field.state.meta.errors[0]?.message || "Last name is required"}
										</FieldError>
									)}
								</field.TextField>
							)}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<SectionLabel.Root size="sm" title="Email address" className="max-lg:hidden" />

					<TextField isDisabled>
						<Label className="lg:hidden">Email address</Label>
						<InputGroup>
							<IconEnvelope data-slot="icon" />
							<Input type="email" value={user.email} />
						</InputGroup>
					</TextField>
				</div>

				<div className="flex justify-end">
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" intent="primary" isDisabled={!canSubmit || isSubmitting}>
								{isSubmitting ? "Saving..." : "Save"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</div>
		</form>
	)
}
