import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Invitation } from "@hazel/db/models"
import { InvitationId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class InvitationResponse extends Schema.Class<InvitationResponse>("InvitationResponse")({
	data: Invitation.Model.json,
	transactionId: TransactionId,
}) {}

export class InvitationNotFoundError extends Schema.TaggedError<InvitationNotFoundError>(
	"InvitationNotFoundError",
)(
	"InvitationNotFoundError",
	{
		invitationId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class InvitationGroup extends HttpApiGroup.make("invitations")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(Invitation.Model.jsonCreate)
			.addSuccess(InvitationResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Invitation",
					description: "Create a new invitation",
					summary: "Create a new invitation",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: InvitationId }))
			.setPayload(Invitation.Model.jsonUpdate)
			.addSuccess(InvitationResponse)
			.addError(InvitationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Invitation",
					description: "Update an existing invitation",
					summary: "Update an invitation",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: InvitationId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(InvitationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Invitation",
					description: "Delete an existing invitation",
					summary: "Delete an invitation",
				}),
			),
	)
	.prefix("/invitations")
	.middleware(Authorization) {}