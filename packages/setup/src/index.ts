#!/usr/bin/env bun
import { Command } from "@effect/cli"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { setupCommand } from "./commands/setup.ts"
import { SecretGenerator } from "./services/secrets.ts"
import { CredentialValidator } from "./services/validators.ts"
import { EnvWriter } from "./services/env-writer.ts"

const cli = Command.run(setupCommand, {
	name: "hazel-setup",
	version: "0.0.1",
})

const ServicesLive = Layer.mergeAll(
	SecretGenerator.Default,
	CredentialValidator.Default,
	EnvWriter.Default
)

cli(process.argv).pipe(Effect.provide(ServicesLive), Effect.provide(BunContext.layer), BunRuntime.runMain)
