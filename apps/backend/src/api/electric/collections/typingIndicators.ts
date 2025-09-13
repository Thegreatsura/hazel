import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { TypingIndicator } from "@hazel/db/models"
import { TypingIndicatorId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class TypingIndicatorResponse extends Schema.Class<TypingIndicatorResponse>("TypingIndicatorResponse")({
	data: TypingIndicator.Model.json,
	transactionId: TransactionId,
}) {}

export class TypingIndicatorNotFoundError extends Schema.TaggedError<TypingIndicatorNotFoundError>(
	"TypingIndicatorNotFoundError",
)(
	"TypingIndicatorNotFoundError",
	{
		typingIndicatorId: Schema.UUID,
	},
	{
		status: 404,
		description: "The typing indicator was not found",
	},
) {}

export class TypingIndicatorGroup extends HttpApiGroup.make("typingIndicators")
	.add(
		HttpApiEndpoint.post("create")`/`
			.setPayload(TypingIndicator.Model.json)
			.addSuccess(TypingIndicatorResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Typing Indicator",
					description: "Record that a user is typing in a channel",
					summary: "Start typing",
				}),
			),
	)
	.add(
		HttpApiEndpoint.patch("update")`/{id}`
			.setPayload(TypingIndicator.Model.json)
			.setPath(Schema.Struct({ id: TypingIndicatorId }))
			.addSuccess(TypingIndicatorResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.addError(TypingIndicatorNotFoundError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Typing Indicator",
					description: "Update the typing indicator timestamp",
					summary: "Update typing",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete")`/{id}`
			.setPath(Schema.Struct({ id: TypingIndicatorId }))
			.addSuccess(TypingIndicatorResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.addError(TypingIndicatorNotFoundError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Typing Indicator",
					description: "Remove typing indicator when user stops typing",
					summary: "Stop typing",
				}),
			),
	)
	.prefix("/typing-indicators")
	.middleware(Authorization) {}