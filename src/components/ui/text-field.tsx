import { Field } from "@ark-ui/solid"
import { type JSXElement, Show } from "solid-js"
import { FieldErrorText, FieldGroup, FieldHelperText, FieldLabel, FieldRoot } from "./field"

export interface TextFieldProps extends Omit<Field.InputProps, "prefix"> {
	label?: string
	helperText?: string
	errorText?: string

	prefix?: JSXElement
	suffix?: JSXElement
}

export const TextField = (props: TextFieldProps) => (
	<FieldRoot invalid>
		<Show when={props.label}>
			<FieldLabel>{props.label}</FieldLabel>
		</Show>
		<FieldGroup>
			<Show when={props.prefix}>
				<Show when={typeof props.prefix === "string"} fallback={props.prefix}>
					<span class="ml-2 text-muted-fg">{props.prefix}</span>
				</Show>
			</Show>
			<Field.Input class="w-full min-w-0 bg-transparent px-2.5 py-2 text-base text-fg placeholder-muted-fg outline-hidden focus:outline-hidden sm:text-sm/6 [&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden" />
			<Show when={props.suffix}>
				<Show when={typeof props.suffix === "string"} fallback={props.suffix}>
					<span class="mr-2 text-muted-fg">{props.suffix}</span>
				</Show>
			</Show>
		</FieldGroup>
		<Show when={props.helperText}>
			<FieldHelperText>{props.helperText}</FieldHelperText>
		</Show>
		<FieldErrorText>{props.errorText}</FieldErrorText>
	</FieldRoot>
)
