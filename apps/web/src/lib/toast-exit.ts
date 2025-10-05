import { type Cause, Exit } from "effect"
import { toast } from "sonner"

export interface ToastExitOptions<A, E> {
	loading: string
	success: string | ((value: A) => string)
	error: string | ((cause: Cause.Cause<E>) => string)
}

/**
 * Toast utility for Effect Exit types from promiseExit mode.
 *
 * Unlike toast.promise(), this handles Exit<A, E> which always resolves
 * but contains either Success or Failure state.
 *
 * @example
 * ```tsx
 * toastExit(
 *   createChannel({ payload: {...} }),
 *   {
 *     loading: "Creating channel...",
 *     success: (result) => `Channel created: ${result.data.name}`,
 *     error: "Failed to create channel"
 *   }
 * )
 * ```
 */
export async function toastExit<A, E>(
	promiseExit: Promise<Exit.Exit<A, E>>,
	options: ToastExitOptions<A, E>,
): Promise<Exit.Exit<A, E>> {
	const loadingToast = toast.loading(options.loading)

	const exit = await promiseExit

	return Exit.match(exit, {
		onSuccess: (value) => {
			const message = typeof options.success === "function" ? options.success(value) : options.success
			toast.success(message, { id: loadingToast })
			return exit
		},
		onFailure: (cause) => {
			const message = typeof options.error === "function" ? options.error(cause) : options.error
			toast.error(message, { id: loadingToast })
			return exit
		},
	})
}
