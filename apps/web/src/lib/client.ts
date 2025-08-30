import { FetchHttpClient, HttpApiClient } from "@effect/platform"

import { HazelApi } from "@hazel/backendv2/api"
import { Effect } from "effect"

export const backendClient = HttpApiClient.make(HazelApi, {
	baseUrl: "http://localhost:3003",
}).pipe(Effect.provide(FetchHttpClient.layer))
