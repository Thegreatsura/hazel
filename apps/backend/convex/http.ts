import { httpRouter } from "convex/server"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

http.route({
	path: "/store",
	method: "PUT",
	handler: httpAction(async (ctx, request) => {
		// Step 1: Store the file
		const blob = await request.blob()
		const storageId = await ctx.storage.store(blob)

		return new Response(storageId, {
			status: 200,
			// CORS headers
			headers: new Headers({
				// e.g. https://mywebsite.com, configured on your Convex dashboard
				"Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
				Vary: "origin",
			}),
		})
	}),
})

http.route({
	path: "/workos",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const signature = request.headers.get("workos-signature")!

		const body = await request.json()

		const result = await ctx.runAction(internal.workosActions.verifyWorkosWebhook, {
			payload: body,
			signature,
		})

		if (!result.valid) {
			return new Response(result.error, {
				status: 400,
				headers: new Headers({
					"Content-Type": "text/plain",
				}),
			})
		}

		const res = await ctx.runMutation(internal.workos.processWorkosEvents, {
			event: result.event,
		})

		if (!res.success) {
			return new Response(res.error, {
				status: 500,
				headers: new Headers({
					"Content-Type": "text/plain",
				}),
			})
		}

		return new Response()
	}),
})

export default http
