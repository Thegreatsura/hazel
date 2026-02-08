/**
 * Craft API Client
 *
 * Effect-based HTTP client for Craft REST API with schema validation,
 * retries, and proper error handling.
 *
 * Key difference from other integrations: Craft uses per-space base URLs
 * and Bearer tokens instead of a single OAuth endpoint.
 */

import { FetchHttpClient, HttpBody, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { Duration, Effect, Schedule, Schema } from "effect"

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_TIMEOUT = Duration.seconds(30)

// ============================================================================
// Domain Schemas (exported for consumers)
// ============================================================================

export const CraftBlockType = Schema.Literal(
	"textBlock",
	"horizontalRuleBlock",
	"tableBlock",
	"codeBlock",
	"imageBlock",
	"fileBlock",
	"drawingBlock",
	"urlBlock",
	"videoBlock",
	"cardBlock",
)
export type CraftBlockType = typeof CraftBlockType.Type

export const CraftBlock = Schema.Struct({
	id: Schema.String,
	type: Schema.String,
	content: Schema.optional(Schema.String),
	style: Schema.optional(Schema.Unknown),
	subblocks: Schema.optional(Schema.Array(Schema.Unknown)),
	hasSubblocks: Schema.optional(Schema.Boolean),
	url: Schema.optional(Schema.String),
	filename: Schema.optional(Schema.String),
	listStyle: Schema.optional(Schema.Unknown),
})
export type CraftBlock = typeof CraftBlock.Type

export const CraftDocument = Schema.Struct({
	id: Schema.String,
	title: Schema.optional(Schema.String),
	type: Schema.optional(Schema.String),
	createdAt: Schema.optional(Schema.String),
	updatedAt: Schema.optional(Schema.String),
	folderId: Schema.optional(Schema.NullOr(Schema.String)),
})
export type CraftDocument = typeof CraftDocument.Type

export const CraftFolder = Schema.Struct({
	id: Schema.String,
	title: Schema.optional(Schema.String),
	createdAt: Schema.optional(Schema.String),
	updatedAt: Schema.optional(Schema.String),
	parentId: Schema.optional(Schema.NullOr(Schema.String)),
})
export type CraftFolder = typeof CraftFolder.Type

export const CraftTask = Schema.Struct({
	id: Schema.String,
	content: Schema.optional(Schema.String),
	isDone: Schema.optional(Schema.Boolean),
	documentId: Schema.optional(Schema.String),
	createdAt: Schema.optional(Schema.String),
	updatedAt: Schema.optional(Schema.String),
})
export type CraftTask = typeof CraftTask.Type

export const CraftCollection = Schema.Struct({
	id: Schema.String,
	title: Schema.optional(Schema.String),
	type: Schema.optional(Schema.String),
})
export type CraftCollection = typeof CraftCollection.Type

export const CraftSpaceInfo = Schema.Struct({
	id: Schema.optional(Schema.String),
	name: Schema.optional(Schema.String),
	type: Schema.optional(Schema.String),
})
export type CraftSpaceInfo = typeof CraftSpaceInfo.Type

// ============================================================================
// Error Types
// ============================================================================

export class CraftApiError extends Schema.TaggedError<CraftApiError>()("CraftApiError", {
	message: Schema.String,
	status: Schema.optional(Schema.Number),
	cause: Schema.optional(Schema.Unknown),
}) {}

export class CraftNotFoundError extends Schema.TaggedError<CraftNotFoundError>()("CraftNotFoundError", {
	resourceType: Schema.String,
	resourceId: Schema.String,
}) {}

export class CraftRateLimitError extends Schema.TaggedError<CraftRateLimitError>()("CraftRateLimitError", {
	message: Schema.String,
	retryAfter: Schema.optional(Schema.Number),
}) {}

// ============================================================================
// Internal Response Schemas
// ============================================================================

const SpaceInfoResponse = Schema.Struct({
	id: Schema.optional(Schema.String),
	name: Schema.optional(Schema.String),
	type: Schema.optional(Schema.String),
})

const BlocksResponse = Schema.Array(CraftBlock)

const DocumentsResponse = Schema.Array(CraftDocument)

const FoldersResponse = Schema.Array(CraftFolder)

const TasksResponse = Schema.Array(CraftTask)

const CollectionsResponse = Schema.Array(CraftCollection)

const CollectionSchemaResponse = Schema.Struct({
	id: Schema.optional(Schema.String),
	fields: Schema.optional(Schema.Array(Schema.Unknown)),
})

const CollectionItemsResponse = Schema.Array(Schema.Unknown)

const SearchResultsResponse = Schema.Struct({
	results: Schema.optional(Schema.Array(Schema.Unknown)),
})

// ============================================================================
// Retry Strategy
// ============================================================================

/**
 * Retry schedule for transient Craft API errors.
 * Retries up to 3 times with exponential backoff (100ms, 200ms, 400ms)
 */
const makeRetrySchedule = Schedule.exponential("100 millis").pipe(Schedule.intersect(Schedule.recurs(3)))

/**
 * Check if an error is retryable (rate limit or server error)
 */
const isRetryableError = (error: CraftApiError | CraftNotFoundError | CraftRateLimitError): boolean => {
	if (error._tag === "CraftRateLimitError") return true
	if (error._tag === "CraftApiError" && error.status !== undefined) {
		return error.status === 429 || error.status >= 500
	}
	return false
}

// ============================================================================
// CraftApiClient Service
// ============================================================================

/**
 * Craft API Client Service.
 *
 * Provides methods for interacting with the Craft REST API using Effect HttpClient
 * with proper schema validation, retries, and timeouts.
 *
 * Unlike Linear (single GraphQL endpoint), Craft uses per-space base URLs
 * with Bearer token authentication.
 *
 * ## Usage
 *
 * ```typescript
 * const spaceInfo = yield* CraftApiClient.getSpaceInfo(baseUrl, accessToken)
 * const documents = yield* CraftApiClient.listDocuments(baseUrl, accessToken)
 * ```
 */
export class CraftApiClient extends Effect.Service<CraftApiClient>()("CraftApiClient", {
	accessors: true,
	effect: Effect.gen(function* () {
		const httpClient = yield* HttpClient.HttpClient

		/**
		 * Create an authenticated client with Craft headers for a specific space
		 */
		const makeClient = (baseUrl: string, accessToken: string) =>
			httpClient.pipe(
				HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)),
				HttpClient.mapRequest(
					HttpClientRequest.setHeaders({
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
						Accept: "application/json",
					}),
				),
			)

		/**
		 * Execute an HTTP request and handle all errors
		 */
		const executeRequest = <R>(
			client: HttpClient.HttpClient,
			method: "GET" | "POST" | "PUT" | "DELETE",
			path: string,
			body?: unknown,
		): Effect.Effect<R, CraftApiError | CraftRateLimitError | CraftNotFoundError> =>
			Effect.gen(function* () {
				const request =
					method === "GET"
						? client.get(path)
						: method === "POST"
							? client.post(path, {
									body: body ? HttpBody.json(body) : undefined,
								})
							: method === "PUT"
								? client.put(path, {
										body: body ? HttpBody.json(body) : undefined,
									})
								: client.del(path, {
										body: body ? HttpBody.json(body) : undefined,
									})

				const response = yield* request.pipe(Effect.scoped, Effect.timeout(DEFAULT_TIMEOUT))

				if (response.status === 429) {
					return yield* Effect.fail(
						new CraftRateLimitError({
							message: "Rate limit exceeded, try again later",
						}),
					)
				}

				if (response.status === 401 || response.status === 403) {
					return yield* Effect.fail(
						new CraftApiError({
							message: "Craft authentication failed - check your API token",
							status: response.status,
						}),
					)
				}

				if (response.status === 404) {
					return yield* Effect.fail(
						new CraftNotFoundError({
							resourceType: "resource",
							resourceId: path,
						}),
					)
				}

				if (response.status >= 400) {
					return yield* Effect.fail(
						new CraftApiError({
							message: `Craft API error (${response.status})`,
							status: response.status,
						}),
					)
				}

				// For 204 No Content, return empty
				if (response.status === 204) {
					return undefined as R
				}

				return yield* response.json as Effect.Effect<R>
			}).pipe(
				Effect.catchTag("TimeoutException", () =>
					Effect.fail(new CraftApiError({ message: "Request timed out" })),
				),
				Effect.catchTag("RequestError", (error) =>
					Effect.fail(
						new CraftApiError({
							message: `Network error: ${String(error)}`,
							cause: error,
						}),
					),
				),
				Effect.catchTag("ResponseError", (error) =>
					Effect.fail(
						new CraftApiError({
							message: `Response error: ${String(error)}`,
							status: error.response.status,
							cause: error,
						}),
					),
				),
				Effect.catchTag("HttpBodyError", (error) =>
					Effect.fail(
						new CraftApiError({
							message: `Body encoding error: ${String(error)}`,
							cause: error,
						}),
					),
				),
			)

		// ====================================================================
		// Connection
		// ====================================================================

		const getSpaceInfo = (baseUrl: string, accessToken: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const raw = yield* executeRequest(client, "GET", "/space")
				return yield* Schema.decodeUnknown(SpaceInfoResponse)(raw).pipe(
					Effect.mapError(
						(e) => new CraftApiError({ message: "Unexpected response format", cause: e }),
					),
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.getSpaceInfo"),
			)

		// ====================================================================
		// Blocks
		// ====================================================================

		const getBlocks = (baseUrl: string, accessToken: string, documentId: string, blockId?: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const path = blockId
					? `/documents/${documentId}/blocks/${blockId}`
					: `/documents/${documentId}/blocks`
				const raw = yield* executeRequest(client, "GET", path)
				return yield* Schema.decodeUnknown(BlocksResponse)(raw).pipe(
					Effect.catchAll(() => Effect.succeed(Array.isArray(raw) ? (raw as CraftBlock[]) : [raw as CraftBlock])),
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.getBlocks", { attributes: { documentId } }),
			)

		const insertBlocks = (
			baseUrl: string,
			accessToken: string,
			documentId: string,
			blocks: ReadonlyArray<{ type: string; content?: string; listStyle?: unknown }>,
			parentBlockId?: string,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const path = parentBlockId
					? `/documents/${documentId}/blocks/${parentBlockId}/blocks`
					: `/documents/${documentId}/blocks`
				return yield* executeRequest(client, "POST", path, { blocks })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.insertBlocks", { attributes: { documentId } }),
			)

		const updateBlocks = (
			baseUrl: string,
			accessToken: string,
			documentId: string,
			blocks: ReadonlyArray<{ id: string; content?: string; style?: unknown }>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "PUT", `/documents/${documentId}/blocks`, { blocks })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.updateBlocks", { attributes: { documentId } }),
			)

		const deleteBlocks = (
			baseUrl: string,
			accessToken: string,
			documentId: string,
			blockIds: ReadonlyArray<string>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "DELETE", `/documents/${documentId}/blocks`, { blockIds })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.deleteBlocks", { attributes: { documentId } }),
			)

		const moveBlocks = (
			baseUrl: string,
			accessToken: string,
			documentId: string,
			blockIds: ReadonlyArray<string>,
			targetBlockId: string,
			position?: "before" | "after" | "inside",
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", `/documents/${documentId}/blocks/move`, {
					blockIds,
					targetBlockId,
					position: position ?? "after",
				})
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.moveBlocks", { attributes: { documentId } }),
			)

		const searchBlocks = (baseUrl: string, accessToken: string, documentId: string, query: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const raw = yield* executeRequest(client, "POST", `/documents/${documentId}/blocks/search`, {
					query,
				})
				return raw as unknown[]
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.searchBlocks", { attributes: { documentId, query } }),
			)

		// ====================================================================
		// Documents
		// ====================================================================

		const listDocuments = (
			baseUrl: string,
			accessToken: string,
			folderId?: string,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const path = folderId ? `/folders/${folderId}/documents` : "/documents"
				const raw = yield* executeRequest(client, "GET", path)
				return yield* Schema.decodeUnknown(DocumentsResponse)(raw).pipe(
					Effect.catchAll(() => Effect.succeed(Array.isArray(raw) ? (raw as CraftDocument[]) : [])),
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.listDocuments"),
			)

		const searchDocuments = (baseUrl: string, accessToken: string, query: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const raw = yield* executeRequest(client, "POST", "/documents/search", { query })
				return raw as unknown[]
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.searchDocuments", { attributes: { query } }),
			)

		const createDocuments = (
			baseUrl: string,
			accessToken: string,
			documents: ReadonlyArray<{ title: string; folderId?: string; content?: string }>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", "/documents", { documents })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.createDocuments"),
			)

		const deleteDocuments = (
			baseUrl: string,
			accessToken: string,
			documentIds: ReadonlyArray<string>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "DELETE", "/documents", { documentIds })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.deleteDocuments"),
			)

		const moveDocuments = (
			baseUrl: string,
			accessToken: string,
			documentIds: ReadonlyArray<string>,
			targetFolderId: string,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", "/documents/move", {
					documentIds,
					targetFolderId,
				})
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.moveDocuments"),
			)

		// ====================================================================
		// Folders
		// ====================================================================

		const listFolders = (baseUrl: string, accessToken: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const raw = yield* executeRequest(client, "GET", "/folders")
				return yield* Schema.decodeUnknown(FoldersResponse)(raw).pipe(
					Effect.catchAll(() => Effect.succeed(Array.isArray(raw) ? (raw as CraftFolder[]) : [])),
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.listFolders"),
			)

		const createFolders = (
			baseUrl: string,
			accessToken: string,
			folders: ReadonlyArray<{ title: string; parentId?: string }>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", "/folders", { folders })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.createFolders"),
			)

		const deleteFolders = (
			baseUrl: string,
			accessToken: string,
			folderIds: ReadonlyArray<string>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "DELETE", "/folders", { folderIds })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.deleteFolders"),
			)

		const moveFolders = (
			baseUrl: string,
			accessToken: string,
			folderIds: ReadonlyArray<string>,
			targetParentId: string,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", "/folders/move", {
					folderIds,
					targetParentId,
				})
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.moveFolders"),
			)

		// ====================================================================
		// Tasks
		// ====================================================================

		const getTasks = (
			baseUrl: string,
			accessToken: string,
			scope?: "inbox" | "active" | "upcoming" | "logbook",
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const path = scope ? `/tasks?scope=${scope}` : "/tasks"
				const raw = yield* executeRequest(client, "GET", path)
				return yield* Schema.decodeUnknown(TasksResponse)(raw).pipe(
					Effect.catchAll(() => Effect.succeed(Array.isArray(raw) ? (raw as CraftTask[]) : [])),
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.getTasks", { attributes: { scope: scope ?? "all" } }),
			)

		const createTasks = (
			baseUrl: string,
			accessToken: string,
			tasks: ReadonlyArray<{ content: string; documentId?: string }>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", "/tasks", { tasks })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.createTasks"),
			)

		const updateTasks = (
			baseUrl: string,
			accessToken: string,
			tasks: ReadonlyArray<{ id: string; content?: string; isDone?: boolean }>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "PUT", "/tasks", { tasks })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.updateTasks"),
			)

		const deleteTasks = (
			baseUrl: string,
			accessToken: string,
			taskIds: ReadonlyArray<string>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "DELETE", "/tasks", { taskIds })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.deleteTasks"),
			)

		// ====================================================================
		// Collections
		// ====================================================================

		const listCollections = (baseUrl: string, accessToken: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const raw = yield* executeRequest(client, "GET", "/collections")
				return yield* Schema.decodeUnknown(CollectionsResponse)(raw).pipe(
					Effect.catchAll(() => Effect.succeed(Array.isArray(raw) ? (raw as CraftCollection[]) : [])),
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.listCollections"),
			)

		const getCollectionSchema = (baseUrl: string, accessToken: string, collectionId: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "GET", `/collections/${collectionId}/schema`)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.getCollectionSchema", { attributes: { collectionId } }),
			)

		const getCollectionItems = (baseUrl: string, accessToken: string, collectionId: string) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				const raw = yield* executeRequest(client, "GET", `/collections/${collectionId}/items`)
				return Array.isArray(raw) ? (raw as unknown[]) : []
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.getCollectionItems", { attributes: { collectionId } }),
			)

		const addCollectionItems = (
			baseUrl: string,
			accessToken: string,
			collectionId: string,
			items: ReadonlyArray<Record<string, unknown>>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "POST", `/collections/${collectionId}/items`, { items })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.addCollectionItems", { attributes: { collectionId } }),
			)

		const updateCollectionItems = (
			baseUrl: string,
			accessToken: string,
			collectionId: string,
			items: ReadonlyArray<Record<string, unknown>>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "PUT", `/collections/${collectionId}/items`, { items })
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.updateCollectionItems", { attributes: { collectionId } }),
			)

		const deleteCollectionItems = (
			baseUrl: string,
			accessToken: string,
			collectionId: string,
			itemIds: ReadonlyArray<string>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(client, "DELETE", `/collections/${collectionId}/items`, {
					itemIds,
				})
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.deleteCollectionItems", { attributes: { collectionId } }),
			)

		// ====================================================================
		// Comments
		// ====================================================================

		const addComments = (
			baseUrl: string,
			accessToken: string,
			documentId: string,
			blockId: string,
			comments: ReadonlyArray<{ content: string }>,
		) =>
			Effect.gen(function* () {
				const client = makeClient(baseUrl, accessToken)
				return yield* executeRequest(
					client,
					"POST",
					`/documents/${documentId}/blocks/${blockId}/comments`,
					{ comments },
				)
			}).pipe(
				Effect.retry({ schedule: makeRetrySchedule, while: isRetryableError }),
				Effect.withSpan("CraftApiClient.addComments", { attributes: { documentId, blockId } }),
			)

		return {
			// Connection
			getSpaceInfo,
			// Blocks
			getBlocks,
			insertBlocks,
			updateBlocks,
			deleteBlocks,
			moveBlocks,
			searchBlocks,
			// Documents
			listDocuments,
			searchDocuments,
			createDocuments,
			deleteDocuments,
			moveDocuments,
			// Folders
			listFolders,
			createFolders,
			deleteFolders,
			moveFolders,
			// Tasks
			getTasks,
			createTasks,
			updateTasks,
			deleteTasks,
			// Collections
			listCollections,
			getCollectionSchema,
			getCollectionItems,
			addCollectionItems,
			updateCollectionItems,
			deleteCollectionItems,
			// Comments
			addComments,
		}
	}),
	dependencies: [FetchHttpClient.layer],
}) {}
