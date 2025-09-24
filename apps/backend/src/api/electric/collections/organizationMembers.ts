import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { OrganizationMember } from "@hazel/db/models"
import { OrganizationMemberId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"
import { OrganizationNotFoundError } from "./organizations"

export class OrganizationMemberResponse extends Schema.Class<OrganizationMemberResponse>(
	"OrganizationMemberResponse",
)({
	data: OrganizationMember.Model.json,
	transactionId: TransactionId,
}) {}

export class OrganizationMemberNotFoundError extends Schema.TaggedError<OrganizationMemberNotFoundError>(
	"OrganizationMemberNotFoundError",
)(
	"OrganizationMemberNotFoundError",
	{
		organizationMemberId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class OrganizationMemberGroup extends HttpApiGroup.make("organizationMembers")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(OrganizationMember.Model.jsonCreate)
			.addSuccess(OrganizationMemberResponse)
			.addError(OrganizationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Organization Member",
					description: "Add a user to an organization",
					summary: "Create an organization member",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: OrganizationMemberId }))
			.setPayload(OrganizationMember.Model.jsonUpdate)
			.addSuccess(OrganizationMemberResponse)
			.addError(OrganizationMemberNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Organization Member",
					description: "Update organization member role and settings",
					summary: "Update an organization member",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: OrganizationMemberId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(OrganizationMemberNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Organization Member",
					description: "Remove a user from an organization",
					summary: "Remove an organization member",
				}),
			),
	)
	.prefix("/organization-members")
	.middleware(Authorization) {}
