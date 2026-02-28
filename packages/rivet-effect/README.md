# @hazel/rivet-effect

Effect-first helpers for building Rivet actors with typed context access, lifecycle wrappers, and runtime integration.

## Highlights

- Typed context service via `RivetActorContext`
- Effect wrappers for actor hooks and actions
- Queue helpers for message processing
- Runtime-aware execution helpers (`runPromise`, `runPromiseExit`)

## Error Types

- `RuntimeExecutionError`
- `StatePersistenceError`

Use tag-based handling where effects are consumed:

```ts
import { Effect } from "effect"
import { Action } from "@hazel/rivet-effect"

const save = Action.effect(function* (c) {
	yield* Action.saveState(c, { debounce: 1000 }).pipe(
		Effect.catchTag("StatePersistenceError", (err) => Effect.log(`Failed to save: ${err.message}`)),
	)
})
```

## Queue

```ts
import { Queue, Action, Log } from "@hazel/rivet-effect"

const processLoop = Action.effect(function* (c) {
	const message = yield* Queue.next(c, "tasks", { timeout: 5000 })
	if (message) {
		yield* Log.info("Processing", { id: message.id, name: message.name })
	}
})
```
