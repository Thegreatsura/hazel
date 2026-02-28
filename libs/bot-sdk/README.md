# @hazel-chat/bot-sdk

Official SDK for building bots for Hazel Chat. Built with Effect-TS for type-safe, composable bot development with Electric SQL real-time event streaming.

## Requirements

- **Bun** runtime (>=1.2.0)
- Effect-TS ecosystem

## Installation

```bash
bun add @hazel-chat/bot-sdk
```

Install required peer dependencies:

```bash
bun add effect @effect/platform @effect/platform-bun @effect/rpc @effect/experimental @electric-sql/client
```

Optional peer dependencies (for specific features):

```bash
# For OpenTelemetry tracing
bun add @effect/opentelemetry

# For real-time streaming via actors
bun add rivetkit jose
```

## Quick Start

```typescript
import { createHazelBot, HazelBotClient } from "@hazel-chat/bot-sdk"
import { Effect } from "effect"

const program = Effect.gen(function* () {
	const bot = yield* HazelBotClient

	// Register message handler
	yield* bot.onMessage((message) =>
		Effect.gen(function* () {
			yield* Effect.log(`Received message: ${message.content}`)
		}),
	)

	// Start the bot
	yield* bot.start
})

// Create and run the bot
createHazelBot({
	botToken: process.env.BOT_TOKEN!,
}).runMain(Effect.scoped(program))
```

## Features

- **Real-time Events**: Subscribe to database changes via Electric SQL shape streams
- **Event Queue**: Built-in Effect.Queue for efficient event processing
- **Event Handlers**: onMessage, onMessageUpdate, onMessageDelete, and more
- **Slash Commands**: Register type-safe slash commands with argument parsing
- **@Mention Handling**: Respond to bot mentions in messages
- **Message Operations**: Send, reply, update, delete, and react to messages
- **AI Streaming**: Built-in support for real-time AI response streaming
- **Integration Tools**: Dynamic tool building based on enabled integrations (Linear, GitHub, etc.)
- **Secure Auth**: Bearer token authentication
- **Effect-TS**: Fully Effect-based for composability and error handling

## Slash Commands

```typescript
import { Command, CommandGroup, createHazelBot, HazelBotClient } from "@hazel-chat/bot-sdk"
import { Effect, Schema } from "effect"

const EchoCommand = Command.make("echo", {
	description: "Echo text back",
	args: { text: Schema.String },
})

const commands = CommandGroup.make(EchoCommand)

const program = Effect.gen(function* () {
	const bot = yield* HazelBotClient

	yield* bot.onCommand(EchoCommand, (ctx) =>
		Effect.gen(function* () {
			yield* bot.message.send(ctx.channelId, `Echo: ${ctx.args.text}`)
		}),
	)

	yield* bot.start
})

createHazelBot({
	botToken: process.env.BOT_TOKEN!,
	commands,
}).runMain(Effect.scoped(program))
```

## Message Operations

```typescript
const program = Effect.gen(function* () {
	const bot = yield* HazelBotClient

	yield* bot.onMessage((message) =>
		Effect.gen(function* () {
			// Send a message
			yield* bot.message.send(message.channelId, "Hello!")

			// Reply to a message
			yield* bot.message.reply(message, "This is a reply")

			// React to a message
			yield* bot.message.react(message, "👍")

			// Update a message
			yield* bot.message.update(message, "Updated content")

			// Delete a message
			yield* bot.message.delete(message.id)

			// List messages with pagination
			const page = yield* bot.message.list(message.channelId, { limit: 25 })
		}),
	)

	yield* bot.start
})
```

## @Mention Handling

```typescript
createHazelBot({
	botToken: process.env.BOT_TOKEN!,
	mentionable: true,
})

// In your program:
yield *
	bot.onMention((message) =>
		Effect.gen(function* () {
			yield* bot.message.reply(message, "You mentioned me! How can I help?")
		}),
	)
```

## Error Handling

The SDK provides typed errors for different failure scenarios:

```typescript
import {
	AuthenticationError,
	ShapeStreamCreateError,
	MessageSendError,
	CommandHandlerError,
} from "@hazel-chat/bot-sdk"

yield *
	bot.start.pipe(
		Effect.catchTags({
			AuthenticationError: (error) => Effect.logError(`Auth failed: ${error.message}`),
			ShapeStreamCreateError: (error) => Effect.logError(`Stream failed: ${error.message}`),
		}),
	)
```

## Architecture

```
Database Changes → Electric SQL → Shape Stream → Event Queue → Your Handlers
```

The bot SDK is composed of several Effect services:

- **ElectricEventQueue**: Manages Effect.Queue instances for each event type
- **ShapeStreamSubscriber**: Subscribes to Electric SQL shape streams
- **EventDispatcher**: Dispatches events to registered handlers
- **SseCommandListener**: Listens for slash command invocations
- **BotAuth**: Manages bot authentication context
- **HazelBotClient**: Main public API for bot developers

## License

MIT
