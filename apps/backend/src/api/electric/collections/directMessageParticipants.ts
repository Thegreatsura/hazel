import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { DirectMessageParticipant } from "@hazel/db/models"
import { DirectMessageParticipantId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class DirectMessageParticipantResponse extends Schema.Class<DirectMessageParticipantResponse>(
	"DirectMessageParticipantResponse",
)({
	data: DirectMessageParticipant.Model.json,
	transactionId: TransactionId,
}) {}

export class DirectMessageParticipantNotFoundError extends Schema.TaggedError<DirectMessageParticipantNotFoundError>(
	"DirectMessageParticipantNotFoundError",
)(
	"DirectMessageParticipantNotFoundError",
	{
		directMessageParticipantId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class DirectMessageParticipantGroup extends HttpApiGroup.make("directMessageParticipants")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(DirectMessageParticipant.Model.jsonCreate)
			.addSuccess(DirectMessageParticipantResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Direct Message Participant",
					description: "Add a participant to a direct message",
					summary: "Create a direct message participant",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: DirectMessageParticipantId }))
			.setPayload(DirectMessageParticipant.Model.jsonUpdate)
			.addSuccess(DirectMessageParticipantResponse)
			.addError(DirectMessageParticipantNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Direct Message Participant",
					description: "Update direct message participant settings",
					summary: "Update a direct message participant",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: DirectMessageParticipantId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(DirectMessageParticipantNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Direct Message Participant",
					description: "Remove a participant from a direct message",
					summary: "Remove a direct message participant",
				}),
			),
	)
	.prefix("/direct-message-participants")
	.middleware(Authorization) {}