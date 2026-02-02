import { ErrorUtils, policy } from "@hazel/domain"
import type { UserId } from "@hazel/schema"
import { Effect } from "effect"

export class UserPolicy extends Effect.Service<UserPolicy>()("UserPolicy/Policy", {
	effect: Effect.gen(function* () {
		const policyEntity = "User" as const

		const canRead = (_id: UserId) =>
			ErrorUtils.refailUnauthorized(
				policyEntity,
				"select",
			)(policy(policyEntity, "select", (_actor) => Effect.succeed(true)))

		const canCreate = () =>
			ErrorUtils.refailUnauthorized(
				policyEntity,
				"create",
			)(policy(policyEntity, "create", (_actor) => Effect.succeed(true)))

		const canUpdate = (id: UserId) =>
			ErrorUtils.refailUnauthorized(
				policyEntity,
				"update",
			)(policy(policyEntity, "update", (actor) => Effect.succeed(actor.id === id)))

		const canDelete = (id: UserId) =>
			ErrorUtils.refailUnauthorized(
				policyEntity,
				"delete",
			)(policy(policyEntity, "delete", (actor) => Effect.succeed(actor.id === id)))

		return { canCreate, canUpdate, canDelete, canRead } as const
	}),
	dependencies: [],
	accessors: true,
}) {}
