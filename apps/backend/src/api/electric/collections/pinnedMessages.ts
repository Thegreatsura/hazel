import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { PinnedMessage } from "@hazel/db/models"
import { PinnedMessageId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"
import { MessageNotFoundError } from "./messages"

export class PinnedMessageResponse extends Schema.Class<PinnedMessageResponse>("PinnedMessageResponse")({
	data: PinnedMessage.Model.json,
	transactionId: TransactionId,
}) {}

export class PinnedMessageNotFoundError extends Schema.TaggedError<PinnedMessageNotFoundError>(
	"PinnedMessageNotFoundError",
)(
	"PinnedMessageNotFoundError",
	{
		pinnedMessageId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class PinnedMessageGroup extends HttpApiGroup.make("pinnedMessages")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(PinnedMessage.Model.jsonCreate)
			.addSuccess(PinnedMessageResponse)
			.addError(MessageNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Pinned Message",
					description: "Pin a message in a channel",
					summary: "Create a pinned message",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: PinnedMessageId }))
			.setPayload(PinnedMessage.Model.jsonUpdate)
			.addSuccess(PinnedMessageResponse)
			.addError(PinnedMessageNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Pinned Message",
					description: "Update an existing pinned message",
					summary: "Update a pinned message",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: PinnedMessageId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(PinnedMessageNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Pinned Message",
					description: "Unpin a message from a channel",
					summary: "Delete a pinned message",
				}),
			),
	)
	.prefix("/pinned-messages")
	.middleware(Authorization) {}