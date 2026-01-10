import { Command, Options, Prompt } from "@effect/cli"
import { Console, Effect, Redacted } from "effect"
import { SecretGenerator } from "../services/secrets.ts"
import { CredentialValidator } from "../services/validators.ts"
import { EnvWriter } from "../services/env-writer.ts"
import { ENV_TEMPLATES, type Config, type S3Config } from "../templates.ts"

// CLI Options
const skipValidation = Options.boolean("skip-validation").pipe(
	Options.withDescription("Skip credential validation (API calls)"),
	Options.withDefault(false)
)

const force = Options.boolean("force").pipe(
	Options.withAlias("f"),
	Options.withDescription("Overwrite existing .env files without prompting"),
	Options.withDefault(false)
)

const dryRun = Options.boolean("dry-run").pipe(
	Options.withAlias("n"),
	Options.withDescription("Show what would be done without writing files"),
	Options.withDefault(false)
)

export const setupCommand = Command.make(
	"setup",
	{ skipValidation, force, dryRun },
	({ skipValidation, force, dryRun }) =>
		Effect.gen(function* () {
			yield* Console.log("\n\u{1F33F} Hazel Local Development Setup\n")

			// Get services
			const envWriter = yield* EnvWriter
			const secrets = yield* SecretGenerator

			// Check for existing .env files
			const hasExisting = yield* envWriter.envFileExists("apps/backend/.env")

			if (hasExisting && !force) {
				const overwrite = yield* Prompt.confirm({
					message: "Existing .env files found. Overwrite?",
					initial: false,
				})
				if (!overwrite) {
					yield* Console.log("Setup cancelled.")
					return
				}
			}

			// Step 1: Local services info
			yield* Console.log("\u2500\u2500\u2500 Step 1: Database & Local Services \u2500\u2500\u2500")
			yield* Console.log("Using Docker Compose defaults:")
			yield* Console.log("  \u2022 PostgreSQL: postgresql://user:password@localhost:5432/app")
			yield* Console.log("  \u2022 Redis: redis://localhost:6380")
			yield* Console.log("  \u2022 Electric: http://localhost:3333\n")

			// Validate database connection
			if (!skipValidation) {
				const validator = yield* CredentialValidator
				const dbResult = yield* validator
					.validateDatabase("postgresql://user:password@localhost:5432/app")
					.pipe(Effect.either)

				if (dbResult._tag === "Left") {
					yield* Console.log(
						"\u26A0\uFE0F  Database not reachable. Run `docker compose up -d` first."
					)
					const continueAnyway = yield* Prompt.confirm({
						message: "Continue anyway?",
						initial: true,
					})
					if (!continueAnyway) return
				} else {
					yield* Console.log("\u2713 Database connected\n")
				}
			}

			// Step 2: WorkOS setup
			yield* Console.log("\u2500\u2500\u2500 Step 2: WorkOS Authentication \u2500\u2500\u2500")
			yield* Console.log("WorkOS provides user authentication.")
			yield* Console.log("Create a free account at https://dashboard.workos.com\n")
			yield* Console.log("1. Create a new project")
			yield* Console.log("2. Go to API Keys \u2192 copy your API key (sk_test_...)")
			yield* Console.log("3. Go to Configuration \u2192 copy Client ID (client_...)")
			yield* Console.log("4. Add redirect URI: http://localhost:3003/auth/callback\n")

			const workosApiKey = yield* Prompt.text({
				message: "Enter your WorkOS API Key",
				validate: (s) =>
					s.startsWith("sk_") ? Effect.succeed(s) : Effect.fail("Must start with sk_"),
			})

			const workosClientId = yield* Prompt.text({
				message: "Enter your WorkOS Client ID",
				validate: (s) =>
					s.startsWith("client_") ? Effect.succeed(s) : Effect.fail("Must start with client_"),
			})

			// Validate WorkOS credentials
			if (!skipValidation) {
				yield* Console.log("\nValidating WorkOS credentials...")
				const validator = yield* CredentialValidator
				const result = yield* validator.validateWorkOS(workosApiKey, workosClientId).pipe(Effect.either)

				if (result._tag === "Left") {
					yield* Console.log(`\u274C WorkOS validation failed: ${result.left.message}`)
					yield* Console.log("Please check your credentials and try again.")
					return
				}
				yield* Console.log("\u2713 WorkOS credentials valid\n")
			}

			// Step 3: Generate secrets
			yield* Console.log("\u2500\u2500\u2500 Step 3: Generating Secrets \u2500\u2500\u2500")
			const generatedSecrets = {
				cookiePassword: secrets.generatePassword(32),
				encryptionKey: secrets.generateEncryptionKey(),
			}
			yield* Console.log("\u2713 Generated WORKOS_COOKIE_PASSWORD")
			yield* Console.log("\u2713 Generated INTEGRATION_ENCRYPTION_KEY\n")

			// Step 4: Optional S3 setup
			yield* Console.log("\u2500\u2500\u2500 Step 4: Optional Services \u2500\u2500\u2500")
			const setupS3 = yield* Prompt.confirm({
				message: "Set up Cloudflare R2/S3 storage? (file uploads)",
				initial: false,
			})

			let s3Config: S3Config | undefined
			if (setupS3) {
				const bucket = yield* Prompt.text({ message: "S3 Bucket name" })
				const endpoint = yield* Prompt.text({ message: "S3 Endpoint URL" })
				const accessKeyId = yield* Prompt.text({ message: "S3 Access Key ID" })
				const secretAccessKeyRedacted = yield* Prompt.password({ message: "S3 Secret Access Key" })
				const secretAccessKey = Redacted.value(secretAccessKeyRedacted)
				const publicUrl = yield* Prompt.text({ message: "Public CDN URL (for images)" })
				s3Config = { bucket, endpoint, accessKeyId, secretAccessKey, publicUrl }
			}

			// Optional: Linear OAuth
			yield* Console.log("\n\u2500\u2500\u2500 Optional: Linear Integration \u2500\u2500\u2500")
			const setupLinear = yield* Prompt.confirm({
				message: "Set up Linear OAuth? (for Linear integration)",
				initial: false,
			})

			let linearConfig: { clientId: string; clientSecret: string } | undefined
			if (setupLinear) {
				yield* Console.log("Create a Linear OAuth app at https://linear.app/settings/api")
				yield* Console.log("Set redirect URI: http://localhost:3003/integrations/linear/callback\n")

				const clientId = yield* Prompt.text({ message: "Linear Client ID" })
				const clientSecretRedacted = yield* Prompt.password({ message: "Linear Client Secret" })
				linearConfig = { clientId, clientSecret: Redacted.value(clientSecretRedacted) }
			}

			// Optional: GitHub Webhook
			yield* Console.log("\n\u2500\u2500\u2500 Optional: GitHub Integration \u2500\u2500\u2500")
			const setupGithub = yield* Prompt.confirm({
				message: "Set up GitHub webhook secret?",
				initial: false,
			})

			let githubWebhookSecret: string | undefined
			if (setupGithub) {
				yield* Console.log("Generate a random secret for GitHub webhook verification\n")
				const useGenerated = yield* Prompt.confirm({
					message: "Auto-generate a secure secret?",
					initial: true,
				})

				if (useGenerated) {
					githubWebhookSecret = secrets.generatePassword(32)
					yield* Console.log(`Generated: ${githubWebhookSecret}`)
					yield* Console.log("Save this for your GitHub webhook configuration\n")
				} else {
					const secretRedacted = yield* Prompt.password({ message: "GitHub Webhook Secret" })
					githubWebhookSecret = Redacted.value(secretRedacted)
				}
			}

			// Optional: OpenRouter API
			yield* Console.log("\n\u2500\u2500\u2500 Optional: AI Features \u2500\u2500\u2500")
			const setupOpenRouter = yield* Prompt.confirm({
				message: "Set up OpenRouter API? (for AI thread naming)",
				initial: false,
			})

			let openrouterApiKey: string | undefined
			if (setupOpenRouter) {
				yield* Console.log("Get your API key at https://openrouter.ai/keys\n")
				const keyRedacted = yield* Prompt.password({ message: "OpenRouter API Key" })
				openrouterApiKey = Redacted.value(keyRedacted)
			}

			// Step 5: Write .env files
			if (dryRun) {
				yield* Console.log("\n\u2500\u2500\u2500 Step 5: Preview .env files (dry-run) \u2500\u2500\u2500")
			} else {
				yield* Console.log("\n\u2500\u2500\u2500 Step 5: Writing .env files \u2500\u2500\u2500")
			}

			const config: Config = {
				workosApiKey,
				workosClientId,
				secrets: generatedSecrets,
				s3: s3Config,
				s3PublicUrl: s3Config?.publicUrl,
				linear: linearConfig,
				githubWebhookSecret,
				openrouterApiKey,
			}

			yield* envWriter.writeEnvFile("apps/web/.env", ENV_TEMPLATES.web(config), dryRun)
			yield* envWriter.writeEnvFile("apps/backend/.env", ENV_TEMPLATES.backend(config), dryRun)
			yield* envWriter.writeEnvFile("apps/cluster/.env", ENV_TEMPLATES.cluster(config), dryRun)
			yield* envWriter.writeEnvFile("apps/electric-proxy/.env", ENV_TEMPLATES.electricProxy(config), dryRun)
			yield* envWriter.writeEnvFile("packages/db/.env", ENV_TEMPLATES.db(), dryRun)

			if (dryRun) {
				yield* Console.log("\nDry-run complete! No files were written.")
				yield* Console.log("Run without --dry-run to apply these changes.\n")
			} else {
				yield* Console.log("\n\u2705 Setup complete!")
				yield* Console.log("Next steps:")
				yield* Console.log("  1. Run `docker compose up -d` to start local services")
				yield* Console.log("  2. Run `bun run db:push` to initialize the database")
				yield* Console.log("  3. Run `bun run dev` to start developing\n")
			}
		})
)
