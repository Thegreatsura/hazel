import { createForm } from "@tanstack/solid-form"
import { useNavigate } from "@tanstack/solid-router"
import { type } from "arktype"
import type { Accessor } from "solid-js"
import { Button } from "~/components/ui/button"
import { TextField } from "~/components/ui/text-field"
import { newId } from "~/lib/id-helpers"
import { useZero } from "~/lib/zero-context"

export interface CreateChannelFormProps {
	serverId: Accessor<string>
	onSuccess?: () => void
}

export const CreateChannelForm = (props: CreateChannelFormProps) => {
	const z = useZero()
	const navigate = useNavigate()

	const form = createForm(() => ({
		defaultValues: {
			channelType: "",
			name: "",
		},
		validators: {
			onSubmit: type({
				name: "3 <= string <= 15",
				channelType: "'public' | 'private'",
			}),
		},
		onSubmit: async ({ value, formApi }) => {
			const channelId = newId("serverChannels")

			await z.mutateBatch(async (tx) => {
				await tx.serverChannels.insert({
					id: channelId,
					serverId: props.serverId(),
					channelType: value.channelType as "public" | "private",
					name: value.name,
				})

				await tx.channelMembers.insert({
					userId: z.userID,
					channelId: channelId,
				})
			})

			formApi.reset()
			props.onSuccess?.()

			navigate({ to: "/$serverId/chat/$id", params: { id: channelId, serverId: props.serverId() } })
		},
	}))

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				form.handleSubmit()
			}}
			class="flex flex-col gap-2"
		>
			<form.Field
				name="name"
				children={(field) => (
					<TextField
						label="Channel Name"
						name={field().name}
						value={field().state.value}
						onBlur={field().handleBlur}
						onInput={(e) => field().handleChange(e.target.value)}
						isInvalid={field().state.meta.errors.length > 0}
						errorText={field().state.meta.errors.join(", ")}
					/>
				)}
			/>
			<form.Field
				name="channelType"
				children={(field) => (
					<TextField
						label="Channel Type"
						name={field().name}
						value={field().state.value}
						onBlur={field().handleBlur}
						onInput={(e) => field().handleChange(e.target.value)}
						isInvalid={field().state.meta.errors.length > 0}
						errorText={field().state.meta.errors.join(", ")}
					/>
				)}
			/>

			<Button type="submit">Create Channel</Button>
		</form>
	)
}
