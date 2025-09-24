import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Channel } from "@hazel/db/models"
import { ChannelId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class CreateChannelResponse extends Schema.Class<CreateChannelResponse>("CreateChannelResponse")({
	data: Channel.Model.json,
	transactionId: TransactionId,
}) {}

export class ChannelNotFoundError extends Schema.TaggedError<ChannelNotFoundError>("ChannelNotFoundError")(
	"ChannelNotFoundError",
	{
		channelId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class ChannelGroup extends HttpApiGroup.make("channels")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(Channel.Model.jsonCreate)
			.addSuccess(CreateChannelResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Channel",
					description: "Create a new channel in an organization",
					summary: "Create a new channel",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: ChannelId }))
			.setPayload(Channel.Model.jsonUpdate)
			.addSuccess(CreateChannelResponse)
			.addError(ChannelNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Channel",
					description: "Update an existing channel",
					summary: "Update a channel",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: ChannelId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(ChannelNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Channel",
					description: "Delete an existing channel",
					summary: "Delete a channel",
				}),
			),
	)
	.prefix("/channels")
	.middleware(Authorization) {}
