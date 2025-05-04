import { Avatar as ArkAvatar } from "@ark-ui/solid"
import { Show, splitProps } from "solid-js"

import { twMerge } from "tailwind-merge"
import { IconUser } from "../icons/user"

export interface AvatarProps extends AvatarRootProps {
	name?: string
	src?: string
}

const getInitials = (name = "") =>
	name
		.split(" ")
		.map((part) => part[0])
		.splice(0, 2)
		.join("")
		.toUpperCase()

export const AvatarMolecule = (props: AvatarProps) => {
	const [localProps, rootProps] = splitProps(props, ["name", "src"])

	return (
		<AvatarRoot {...rootProps}>
			<AvatarFallback>
				<Show when={localProps.name} fallback={<IconUser />}>
					{getInitials(localProps.name)}
				</Show>
			</AvatarFallback>
			<AvatarImage src={localProps.src} alt={localProps.name} />
		</AvatarRoot>
	)
}

export interface AvatarRootProps extends ArkAvatar.RootProps {
	shape?: "circle" | "square"
}

export const AvatarRoot = (props: AvatarRootProps) => {
	const [local, rest] = splitProps(props, ["class", "shape"])

	return (
		<ArkAvatar.Root
			class={twMerge(
				"relative flex size-10 shrink-0 overflow-hidden",
				local.shape === "circle" ? "rounded-full" : "rounded-md",
				local.class,
			)}
			{...rest}
		/>
	)
}

export const AvatarImage = (props: ArkAvatar.ImageProps) => {
	return <ArkAvatar.Image class={twMerge("aspect-square h-full w-full", props.class)} {...props} />
}

export const AvatarFallback = (props: ArkAvatar.FallbackProps) => {
	return (
		<ArkAvatar.Fallback
			class={twMerge("flex h-full w-full select-none items-center justify-center bg-primary", props.class)}
			{...props}
		/>
	)
}

const Avatar = Object.assign(AvatarMolecule, {
	Root: AvatarRoot,
	Image: AvatarImage,
	Fallback: AvatarFallback,
})

export { Avatar }
