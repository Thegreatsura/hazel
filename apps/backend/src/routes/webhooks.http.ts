import { HttpApiBuilder, HttpApiClient, type HttpApiError, HttpServerRequest } from "@effect/platform"
import { Cluster, InternalServerError, withSystemActor } from "@hazel/domain"
import type { Event } from "@workos-inc/node"
import { Config, Effect, pipe } from "effect"
import { HazelApi, InvalidWebhookSignature, WebhookResponse } from "../api"
import { WorkOSSync } from "../services/workos-sync"
import { WorkOSWebhookVerifier } from "../services/workos-webhook"

export const HttpWebhookLive = HttpApiBuilder.group(HazelApi, "webhooks", (handlers) =>
	handlers
		.handle("workos", (_args) =>
			Effect.gen(function* () {
				// Get the raw request to access headers and body
				const request = yield* HttpServerRequest.HttpServerRequest

				// Get the signature header
				const signatureHeader = request.headers["workos-signature"]
				if (!signatureHeader) {
					return yield* Effect.fail(
						new InvalidWebhookSignature({
							message: "Missing workos-signature header",
						}),
					)
				}

				// Get the raw body as string for signature verification
				// The body should be the raw JSON string
				const rawBody = yield* pipe(
					request.text,
					Effect.orElseFail(
						() =>
							new InvalidWebhookSignature({
								message: "Invalid request body",
							}),
					),
				)

				// Verify the webhook signature
				const verifier = yield* WorkOSWebhookVerifier
				yield* pipe(
					verifier.verifyWebhook(signatureHeader, rawBody),
					Effect.mapError((error) => {
						if (
							error._tag === "WebhookVerificationError" ||
							error._tag === "WebhookTimestampError"
						) {
							return new InvalidWebhookSignature({
								message: error.message,
							})
						}
						return error
					}),
				)

				// Parse the webhook payload
				const payload = JSON.parse(rawBody) as Event

				// Log the incoming webhook event
				yield* Effect.logInfo(`Processing WorkOS webhook event: ${payload.event}`, {
					eventId: payload.id,
					eventType: payload.event,
				})

				// Process the webhook event using the sync service
				const syncService = yield* WorkOSSync
				const result = yield* syncService.processWebhookEvent(payload)

				if (!result.success) {
					const errorMessage = "error" in result ? result.error : "Unknown error"
					yield* Effect.logError(`Failed to process webhook event: ${errorMessage}`, {
						eventId: payload.id,
						eventType: payload.event,
						error: errorMessage,
					})
				} else {
					yield* Effect.logInfo(`Successfully processed webhook event`, {
						eventId: payload.id,
						eventType: payload.event,
					})
				}

				// Return success response quickly (WorkOS expects 200 OK)
				return new WebhookResponse({
					success: result.success,
					message: result.success
						? "Event processed successfully"
						: "error" in result
							? result.error
							: "Unknown error",
				})
			}).pipe(withSystemActor),
		)
		.handle("sequinWebhook", ({ payload }) =>
			Effect.gen(function* () {
				// Log the incoming webhook event
				yield* Effect.logInfo("Received Sequin webhook event", {
					action: payload.action,
					tableName: payload.metadata.table_name,
					messageId: payload.record.id,
					channelId: payload.record.channelId,
				})

				// Only process 'insert' actions (new messages)
				if (payload.action !== "insert") {
					yield* Effect.logInfo("Ignoring non-insert action", {
						action: payload.action,
						messageId: payload.record.id,
					})
					return
				}

				const clusterUrl = yield* Config.string("CLUSTER_URL").pipe(Effect.orDie)

				const client = yield* HttpApiClient.make(Cluster.WorkflowApi, {
					baseUrl: clusterUrl,
				})

				// Execute the MessageNotificationWorkflow via HTTP
				// The WorkflowProxy creates an endpoint named after the workflow
				yield* client.workflows
					.MessageNotificationWorkflow({
						payload: {
							messageId: payload.record.id,
							channelId: payload.record.channelId,
							authorId: payload.record.authorId,
						},
					})
					.pipe(
						Effect.catchTags({
							HttpApiDecodeError: (error) =>
								Effect.gen(function* () {
									yield* Effect.logError("Failed to decode workflow response", {
										error: error.message,
									})
									return yield* Effect.fail(
										new InternalServerError({
											message: "Failed to execute notification workflow",
										}),
									)
								}),
							ParseError: (error) =>
								Effect.gen(function* () {
									yield* Effect.logError("Failed to parse workflow response", {
										error: error.message,
									})
									return yield* Effect.fail(
										new InternalServerError({
											message: "Failed to execute notification workflow",
										}),
									)
								}),
							RequestError: (error) =>
								Effect.gen(function* () {
									yield* Effect.logError("Failed to send workflow request", {
										error: error.message,
									})
									return yield* Effect.fail(
										new InternalServerError({
											message: "Failed to execute notification workflow",
										}),
									)
								}),
							ResponseError: (error) =>
								Effect.gen(function* () {
									yield* Effect.logError("Failed to receive workflow response", {
										error: error.message,
									})
									return yield* Effect.fail(
										new InternalServerError({
											message: "Failed to execute notification workflow",
										}),
									)
								}),
						}),
					)

				yield* Effect.logInfo("Sequin webhook processed successfully", {
					messageId: payload.record.id,
				})
			}).pipe(withSystemActor),
		),
)
