/**
 * Render an unknown error to a human-readable string that preserves the most
 * useful diagnostic info: the tag (for Schema.TaggedError instances), the
 * message, and any nested cause. Used when persisting errors to logs/DB
 * fields where structured Effect Causes are not available — `String(err)` on
 * a Schema.TaggedError otherwise collapses to just the tag, hiding `message`
 * and `cause`.
 */
export const formatError = (err: unknown): string => {
	if (err == null) return "unknown error"
	if (typeof err === "string") return err

	if (err instanceof Error) {
		const tag = (err as { _tag?: unknown })._tag
		const cause = (err as { cause?: unknown }).cause
		const head = typeof tag === "string" ? `${tag}: ${err.message}` : err.message
		if (cause == null) return head
		const causeStr = typeof cause === "string" ? cause : formatError(cause)
		return `${head} [cause: ${causeStr}]`
	}

	if (typeof err === "object") {
		try {
			return JSON.stringify(err)
		} catch {
			return Object.prototype.toString.call(err)
		}
	}

	return String(err)
}
