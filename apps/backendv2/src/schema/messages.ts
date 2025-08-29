import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

// Messages table
export const messagesTable = pgTable(
	"messages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		channelId: uuid("channel_id").notNull(),
		authorId: uuid("author_id").notNull(),
		content: text("content").notNull(),
		// Reply to another message
		replyToMessageId: uuid("reply_to_message_id"),
		// Thread channel (if this message started a thread)
		threadChannelId: uuid("thread_channel_id"),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(table) => [
		index("messages_channel_id_idx").on(table.channelId),
		index("messages_author_id_idx").on(table.authorId),
		index("messages_reply_to_idx").on(table.replyToMessageId),
		index("messages_thread_channel_idx").on(table.threadChannelId),
		index("messages_created_at_idx").on(table.createdAt),
		index("messages_deleted_at_idx").on(table.deletedAt),
	],
)

// Message reactions table (normalized from array in Convex)
export const messageReactionsTable = pgTable(
	"message_reactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		messageId: uuid("message_id").notNull(),
		userId: uuid("user_id").notNull(),
		emoji: varchar("emoji", { length: 50 }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("reactions_message_id_idx").on(table.messageId),
		index("reactions_user_id_idx").on(table.userId),
		index("reactions_message_user_emoji_idx").on(table.messageId, table.userId, table.emoji),
	],
)

// Message attachments junction table (normalized from array in Convex)
export const messageAttachmentsTable = pgTable(
	"message_attachments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		messageId: uuid("message_id").notNull(),
		attachmentId: uuid("attachment_id").notNull(),
		displayOrder: integer("display_order").notNull().default(0),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("msg_attachments_message_id_idx").on(table.messageId),
		index("msg_attachments_attachment_id_idx").on(table.attachmentId),
		uniqueIndex("msg_attachments_unique_idx").on(table.messageId, table.attachmentId),
	],
)

// Type exports
export type Message = typeof messagesTable.$inferSelect
export type NewMessage = typeof messagesTable.$inferInsert
export type MessageReaction = typeof messageReactionsTable.$inferSelect
export type NewMessageReaction = typeof messageReactionsTable.$inferInsert
export type MessageAttachment = typeof messageAttachmentsTable.$inferSelect
export type NewMessageAttachment = typeof messageAttachmentsTable.$inferInsert