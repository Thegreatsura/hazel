import { index, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

// Attachment status
export const attachmentStatusEnum = pgEnum("attachment_status", ["uploading", "complete", "failed"])

// Attachments table
export const attachmentsTable = pgTable(
	"attachments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").notNull(),
		channelId: uuid("channel_id"),
		messageId: uuid("message_id"),
		fileName: varchar("file_name", { length: 255 }).notNull(),
		r2Key: varchar("r2_key", { length: 500 }).notNull(), // S3/R2 storage key
		uploadedBy: uuid("uploaded_by").notNull(),
		status: attachmentStatusEnum("status").notNull().default("uploading"),
		uploadedAt: timestamp("uploaded_at", { mode: "date" }).notNull().defaultNow(),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(table) => [
		index("attachments_organization_id_idx").on(table.organizationId),
		index("attachments_channel_id_idx").on(table.channelId),
		index("attachments_message_id_idx").on(table.messageId),
		index("attachments_uploaded_by_idx").on(table.uploadedBy),
		index("attachments_status_idx").on(table.status),
		index("attachments_deleted_at_idx").on(table.deletedAt),
	],
)

// Type exports
export type Attachment = typeof attachmentsTable.$inferSelect
export type NewAttachment = typeof attachmentsTable.$inferInsert
