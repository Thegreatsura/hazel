# @hazel/bot-sdk

Official SDK for building bots for Hazel. Built with Effect-TS for type-safe, composable bot development.

## Features

- 🤖 **Message Operations**: Send, update, and delete messages
- 🔌 **Webhook Events**: Receive real-time events from Hazel
- 🔐 **Bearer Token Auth**: Secure authentication with API tokens
- ⚡ **Effect-TS**: Fully Effect-based for composability and error handling
- 📝 **TypeScript**: Complete type safety throughout

## Installation

```bash
bun add @hazel/bot-sdk
```

## Quick Start

```typescript
import { BotClient, runBot } from "@hazel/bot-sdk"
import { Effect } from "effect"

// Create your bot program
const program = Effect.gen(function*() {
  const bot = yield* BotClient

  // Send a message
  yield* bot.messages.send({
    channelId: "channel-123",
    content: "Hello from bot!"
  })

  // Handle incoming messages
  yield* bot.webhooks.onMessage((event) =>
    Effect.gen(function*() {
      yield* Effect.log("Received message:", event.data.content)

      // Echo the message back
      yield* bot.messages.send({
        channelId: event.data.channelId,
        content: `Echo: ${event.data.content}`
      })
    })
  )

  // Start webhook server
  yield* bot.webhooks.listen(3000)
  yield* Effect.log("Bot is running!")
})

// Run the bot
await runBot(
  {
    botToken: process.env.BOT_TOKEN!,
    rpcUrl: "ws://localhost:3003/rpc"
  },
  program
)
```

## API Reference

### BotClient

Main client service that provides access to all bot functionality.

#### Properties

- `messages`: MessageClient - Send, update, and delete messages
- `webhooks`: WebhookServer - Receive and handle webhook events

### MessageClient

Service for message operations.

#### Methods

##### `send(options: SendMessageOptions)`

Send a message to a channel.

```typescript
yield* bot.messages.send({
  channelId: "channel-123",
  content: "Hello world!",
  attachmentIds: ["attachment-1"] // optional
})
```

##### `update(options: UpdateMessageOptions)`

Update an existing message.

```typescript
yield* bot.messages.update({
  id: "message-123",
  content: "Updated content"
})
```

##### `delete(messageId: MessageId)`

Delete a message.

```typescript
yield* bot.messages.delete("message-123")
```

### WebhookServer

HTTP server for receiving webhook events from Hazel.

#### Methods

##### `onMessage(handler: EventHandler<MessageCreatedEvent>)`

Register a handler for `message.created` events.

```typescript
yield* bot.webhooks.onMessage((event) =>
  Effect.gen(function*() {
    console.log("New message:", event.data.content)
    console.log("From channel:", event.data.channelId)
    console.log("Author:", event.data.authorId)
  })
)
```

##### `onMessageUpdate(handler: EventHandler<MessageUpdatedEvent>)`

Register a handler for `message.updated` events.

```typescript
yield* bot.webhooks.onMessageUpdate((event) =>
  Effect.log("Message updated:", event.data.id)
)
```

##### `onMessageDelete(handler: EventHandler<MessageDeletedEvent>)`

Register a handler for `message.deleted` events.

```typescript
yield* bot.webhooks.onMessageDelete((event) =>
  Effect.log("Message deleted:", event.data.id)
)
```

##### `listen(port: number)`

Start the webhook server on the specified port.

```typescript
yield* bot.webhooks.listen(3000)
```

### Configuration

#### BotConfig

Configuration object for the bot.

```typescript
interface BotConfig {
  // Required: Bot API token for authentication
  botToken: string

  // Required: WebSocket URL for RPC connection
  rpcUrl: string

  // Optional: HTTP API base URL (derived from rpcUrl if not provided)
  baseUrl?: string

  // Optional: Organization ID to scope operations
  organizationId?: string
}
```

#### Environment Variables

You can also configure the bot using environment variables:

- `BOT_TOKEN`: Bot API token
- `BOT_RPC_URL`: WebSocket RPC URL
- `BOT_ORGANIZATION_ID`: Organization ID

```typescript
// Will automatically load from environment variables
const program = Effect.gen(function*() {
  const bot = yield* BotClient
  // ...
})
```

### Helper Functions

#### `makeBotClient(config: BotConfig)`

Create a bot client layer with the given configuration.

```typescript
const BotLayer = makeBotClient({
  botToken: process.env.BOT_TOKEN!,
  rpcUrl: "ws://localhost:3003/rpc"
})

Effect.provide(program, BotLayer).pipe(Effect.runPromise)
```

#### `runBot(config: BotConfig, program: Effect)`

Simplified function to run a bot program.

```typescript
await runBot(
  {
    botToken: process.env.BOT_TOKEN!,
    rpcUrl: "ws://localhost:3003/rpc"
  },
  program
)
```

## Examples

### Echo Bot

```typescript
import { BotClient, runBot } from "@hazel/bot-sdk"
import { Effect } from "effect"

const echoBot = Effect.gen(function*() {
  const bot = yield* BotClient

  yield* bot.webhooks.onMessage((event) =>
    Effect.gen(function*() {
      const content = event.data.content

      // Only echo if message starts with "!echo"
      if (!content.startsWith("!echo ")) {
        return
      }

      const textToEcho = content.slice(6)

      yield* bot.messages.send({
        channelId: event.data.channelId,
        content: `Echo: ${textToEcho}`
      })
    })
  )

  yield* bot.webhooks.listen(3000)
  yield* Effect.log("Echo bot is running!")
})

await runBot(
  {
    botToken: process.env.BOT_TOKEN!,
    rpcUrl: "ws://localhost:3003/rpc"
  },
  echoBot
)
```

### Welcome Bot

```typescript
import { BotClient, runBot } from "@hazel/bot-sdk"
import { Effect } from "effect"

const welcomeBot = Effect.gen(function*() {
  const bot = yield* BotClient

  yield* bot.webhooks.onMessage((event) =>
    Effect.gen(function*() {
      // Send welcome message to new members
      yield* bot.messages.send({
        channelId: event.data.channelId,
        content: `Welcome to the channel! 👋`
      })
    })
  )

  yield* bot.webhooks.listen(3000)
})

await runBot(
  {
    botToken: process.env.BOT_TOKEN!,
    rpcUrl: "ws://localhost:3003/rpc"
  },
  welcomeBot
)
```

## Error Handling

The SDK provides typed errors for different failure scenarios:

```typescript
import { BotAuthenticationError, BotPermissionError } from "@hazel/bot-sdk"
import { Effect, Match } from "effect"

const program = Effect.gen(function*() {
  const bot = yield* BotClient

  const result = yield* bot.messages.send({
    channelId: "channel-123",
    content: "Hello!"
  }).pipe(
    Effect.catchTags({
      BotAuthenticationError: (error) =>
        Effect.logError("Authentication failed:", error.message),
      BotPermissionError: (error) =>
        Effect.logError("Permission denied:", error.message),
      UnauthorizedError: (error) =>
        Effect.logError("Unauthorized:", error.message)
    })
  )
})
```

## Development

### Prerequisites

- Bun runtime
- Hazel backend running locally (or remote URL)
- Bot API token from Hazel

### Testing

```bash
bun test
```

### Building

```bash
bun run build
```

## Architecture

The bot SDK is built with Effect-TS and follows these patterns:

- **Services**: All major components (BotClient, MessageClient, WebhookServer) are Effect Services
- **Layers**: Configuration and dependencies are provided via Layers
- **Error Handling**: All errors are typed and composable
- **Composability**: All operations return Effects that can be composed

### RPC Communication

The SDK uses WebSocket-based RPC for real-time communication with the Hazel backend:

- Protocol: WebSocket (NDJSON serialization)
- Authentication: Bearer token in WebSocket headers
- Reconnection: Automatic retry for transient errors

### Webhook Events

Bots receive events via HTTP webhooks:

- POST requests to `/webhook` endpoint
- JSON payload with event data
- Signature verification (TODO: implement)
- Event queue with concurrent handler execution

## Roadmap

### Phase 2 (Coming Soon)

- [ ] Read operations (list messages, get channel info)
- [ ] Channel operations (create, update, delete)
- [ ] Reaction operations
- [ ] File upload support

### Phase 3

- [ ] Command parser utility
- [ ] Middleware system
- [ ] Rich message builder
- [ ] Declarative event handlers

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## License

MIT
