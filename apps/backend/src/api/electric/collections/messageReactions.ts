import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { MessageReaction } from "@hazel/db/models"
import { MessageReactionId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"
import { MessageNotFoundError } from "./messages"

export class MessageReactionResponse extends Schema.Class<MessageReactionResponse>("MessageReactionResponse")(
	{
		data: MessageReaction.Model.json,
		transactionId: TransactionId,
	},
) {}

export class MessageReactionNotFoundError extends Schema.TaggedError<MessageReactionNotFoundError>(
	"MessageReactionNotFoundError",
)(
	"MessageReactionNotFoundError",
	{
		messageReactionId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class MessageReactionGroup extends HttpApiGroup.make("messageReactions")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(MessageReaction.Model.jsonCreate)
			.addSuccess(MessageReactionResponse)
			.addError(MessageNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Message Reaction",
					description: "Add a reaction to a message",
					summary: "Create a message reaction",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: MessageReactionId }))
			.setPayload(MessageReaction.Model.jsonUpdate)
			.addSuccess(MessageReactionResponse)
			.addError(MessageReactionNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Message Reaction",
					description: "Update an existing message reaction",
					summary: "Update a message reaction",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: MessageReactionId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(MessageReactionNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Message Reaction",
					description: "Remove a reaction from a message",
					summary: "Delete a message reaction",
				}),
			),
	)
	.prefix("/message-reactions")
	.middleware(Authorization) {}
