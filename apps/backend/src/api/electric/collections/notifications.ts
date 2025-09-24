import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Notification } from "@hazel/db/models"
import { NotificationId } from "@hazel/db/schema"
import { Schema } from "effect"
import { Authorization } from "../../../lib/auth"
import { InternalServerError, UnauthorizedError } from "../../../lib/errors"
import { TransactionId } from "../../../lib/schema"

export class NotificationResponse extends Schema.Class<NotificationResponse>("NotificationResponse")({
	data: Notification.Model.json,
	transactionId: TransactionId,
}) {}

export class NotificationNotFoundError extends Schema.TaggedError<NotificationNotFoundError>(
	"NotificationNotFoundError",
)(
	"NotificationNotFoundError",
	{
		notificationId: Schema.UUID,
	},
	{
		status: 404,
	},
) {}

export class NotificationGroup extends HttpApiGroup.make("notifications")
	.add(
		HttpApiEndpoint.post("create", `/`)
			.setPayload(Notification.Model.jsonCreate)
			.addSuccess(NotificationResponse)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Create Notification",
					description: "Create a new notification",
					summary: "Create a notification",
				}),
			),
	)
	.add(
		HttpApiEndpoint.put("update", `/:id`)
			.setPath(Schema.Struct({ id: NotificationId }))
			.setPayload(Notification.Model.jsonUpdate)
			.addSuccess(NotificationResponse)
			.addError(NotificationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Update Notification",
					description: "Update an existing notification",
					summary: "Update a notification",
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("delete", "/:id")
			.setPath(Schema.Struct({ id: NotificationId }))
			.addSuccess(Schema.Struct({ transactionId: TransactionId }))
			.addError(NotificationNotFoundError)
			.addError(UnauthorizedError)
			.addError(InternalServerError)
			.annotateContext(
				OpenApi.annotations({
					title: "Delete Notification",
					description: "Delete an existing notification",
					summary: "Delete a notification",
				}),
			),
	)
	.prefix("/notifications")
	.middleware(Authorization) {}
