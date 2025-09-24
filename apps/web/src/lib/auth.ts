import { eq, useLiveQuery } from "@tanstack/react-db"
import { useAuth } from "@workos-inc/authkit-react"
import { userCollection } from "~/db/collections"

export const useUser = () => {
	const { user: workosUser, organizationId, isLoading, switchToOrganization } = useAuth()

	const { data } = useLiveQuery(
		(q) =>
			workosUser?.id
				? q.from({ user: userCollection }).where(({ user }) => eq(user.externalId, workosUser.id))
				: null,
		[workosUser?.id],
	)

	return {
		user: data?.[0],
		session: workosUser,
		workosOrganizationId: organizationId,
		isLoading,
		switchToOrganization,
	}
}
