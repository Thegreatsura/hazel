import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, Multipart } from "@effect/platform"
import { Schema } from "effect"
import { Authorization } from "../authorization"

export const RootApiGroup = HttpApiGroup.make("Root")
	.add(HttpApiEndpoint.get("root")`/`.addSuccess(Schema.String))
	.add(
		HttpApiEndpoint.put("upload")`/upload`.addSuccess(Schema.String).setPayload(
			HttpApiSchema.Multipart(
				Schema.Struct({
					files: Multipart.FilesSchema,
				}),
			),
		),
	)
	.middleware(Authorization)
