import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform"
import { Unauthorized } from "./errors"
import { CurrentUser } from "./schema/user"

export class Authorization extends HttpApiMiddleware.Tag<Authorization>()("hazel/Authorization", {
	failure: Unauthorized,
	provides: CurrentUser,
	security: {
		bearer: HttpApiSecurity.bearer,
	},
}) {}
