import { Console, Effect } from "effect"
import { dirname } from "node:path"
import { mkdir } from "node:fs/promises"

export class EnvWriter extends Effect.Service<EnvWriter>()("EnvWriter", {
	accessors: true,
	effect: Effect.succeed({
		writeEnvFile: (filePath: string, vars: Record<string, string>, dryRun: boolean = false) =>
			Effect.gen(function* () {
				const content = Object.entries(vars)
					.map(([key, value]) => `${key}=${value}`)
					.join("\n")

				if (dryRun) {
					yield* Console.log(`\n  Would write ${filePath}:`)
					yield* Console.log("  " + "-".repeat(40))
					for (const [key, value] of Object.entries(vars)) {
						const masked =
							key.includes("SECRET") || key.includes("PASSWORD") || key.includes("KEY")
								? value.slice(0, 4) + "..." + value.slice(-4)
								: value
						yield* Console.log(`  ${key}=${masked}`)
					}
				} else {
					const dir = dirname(filePath)
					yield* Effect.promise(() => mkdir(dir, { recursive: true }).catch(() => {}))
					yield* Effect.promise(() => Bun.write(filePath, content + "\n"))
					yield* Console.log(`  \u2713 ${filePath}`)
				}
			}),

		envFileExists: (filePath: string) => Effect.promise(() => Bun.file(filePath).exists()),

		backupExistingEnv: (filePath: string) =>
			Effect.gen(function* () {
				const file = Bun.file(filePath)
				const exists = yield* Effect.promise(() => file.exists())
				if (exists) {
					const backup = `${filePath}.backup.${Date.now()}`
					yield* Effect.promise(() => Bun.write(backup, file))
					yield* Console.log(`  Backed up ${filePath} to ${backup}`)
				}
			}),
	}),
}) {}
