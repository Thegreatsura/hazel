import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, Multipart, OpenApi } from "@effect/platform"
import { Attachment } from "@hazel/db/models"
import { AttachmentId, ChannelId, OrganizationId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class AttachmentResponse extends Schema.Class<AttachmentResponse>("AttachmentResponse")({
	data: Attachment.Model.json,
	transactionId: TransactionId,
}) {}

export class AttachmentNotFoundError extends Schema.TaggedError<AttachmentNotFoundError>(
	"AttachmentNotFoundError",
)(
	"AttachmentNotFoundError",
	{
		attachmentId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class AttachmentGroup extends HttpApiGroup.make("attachments")
	.add(
		HttpApiEndpoint.post("upload", "/upload")
			.setPayload(
				HttpApiSchema.Multipart(
					Schema.Struct({
						file: Multipart.SingleFileSchema,
						organizationId: OrganizationId,
						channelId: ChannelId,
					}),
				),
			)
			.addSuccess(AttachmentResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: AttachmentId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(AttachmentNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Attachment",
					description: "Delete an existing attachment",
					summary: "Delete an attachment",
				}),
			),
	)
	.prefix("/attachments")
	.middleware(Authorization) {}