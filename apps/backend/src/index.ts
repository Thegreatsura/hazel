import { HttpApiBuilder, HttpApiScalar, HttpMiddleware, HttpServer } from "@effect/platform"
import { ConfigProvider, Layer } from "effect"

import { oldUploadHandler } from "./http/old-upload"

import { AuthorizationLive } from "./authorization.live"
import { HttpLive } from "./http"
import { Jose } from "./services/jose"

const Live = HttpLive.pipe(Layer.provide(AuthorizationLive), Layer.provide(Jose.Default))

const HttpApiScalarLayer = HttpApiScalar.layer().pipe(Layer.provide(Live))

declare global {
	var env: Env
	var waitUntil: (promise: Promise<any>) => void
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		Object.assign(globalThis, {
			env,
			waitUntil: (promise: Promise<any>) => ctx.waitUntil(promise),
		})

		const url = new URL(request.url)
		if (url.pathname === "/upload") {
			return await oldUploadHandler(request)!
		}

		const ConfigLayer = Layer.setConfigProvider(
			ConfigProvider.fromJson({ ...env, DATABASE_URL: env.HYPERDRIVE.connectionString }),
		)

		const { dispose, handler } = HttpApiBuilder.toWebHandler(
			Layer.mergeAll(Live, HttpApiScalarLayer, HttpServer.layerContext).pipe(Layer.provide(ConfigLayer)),
			{
				middleware: HttpMiddleware.cors(),
			},
		)

		const res = await handler(request)

		ctx.waitUntil(dispose())

		return res
	},
} satisfies ExportedHandler<Env>
