# @hazel/rivet-effect

Effect-first helpers for building Rivet actors with typed context access, lifecycle wrappers, and runtime integration.

## Highlights

- Typed context service via `RivetActorContext`
- Effect wrappers for actor hooks and actions
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
		Effect.catchTag("StatePersistenceError", (err) =>
			Effect.log(`Failed to save: ${err.message}`),
		),
	)
})
```
