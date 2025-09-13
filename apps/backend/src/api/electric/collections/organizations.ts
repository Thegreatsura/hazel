import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Organization } from "@hazel/db/models"
import { OrganizationId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class OrganizationResponse extends Schema.Class<OrganizationResponse>("OrganizationResponse")({
	data: Organization.Model.json,
	transactionId: TransactionId,
}) {}

export class OrganizationNotFoundError extends Schema.TaggedError<OrganizationNotFoundError>(
	"OrganizationNotFoundError",
)(
	"OrganizationNotFoundError",
	{
		organizationId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class OrganizationGroup extends HttpApiGroup.make("organizations")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(Organization.Model.jsonCreate)
			.addSuccess(OrganizationResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Organization",
					description: "Create a new organization",
					summary: "Create a new organization",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: OrganizationId }))
			.setPayload(Organization.Model.jsonUpdate)
			.addSuccess(OrganizationResponse)
			.addError(OrganizationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Organization",
					description: "Update an existing organization",
					summary: "Update an organization",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: OrganizationId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(OrganizationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Organization",
					description: "Delete an existing organization",
					summary: "Delete an organization",
				}),
			),
	)
	.prefix("/organizations")
	.middleware(Authorization) {}