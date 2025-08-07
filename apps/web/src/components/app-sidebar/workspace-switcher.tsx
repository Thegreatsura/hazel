import { convexQuery } from "@convex-dev/react-query"
import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useAuth } from "@workos-inc/authkit-react"
import { useState } from "react"
import { Button as AriaButton } from "react-aria-components"
import { cx } from "~/utils/cx"
import { CreateOrganizationModal } from "../application/modals/create-organization-modal"
import { EmailInviteModal } from "../application/modals/email-invite-modal"
import { Avatar } from "../base/avatar/avatar"
import { Dropdown } from "../base/dropdown/dropdown"
import IconPlusStroke from "../icons/IconPlusStroke"
import IconUserPlus1 from "../icons/IconUserPlus1"

export const WorkspaceSwitcher = () => {
	const [inviteModalOpen, setInviteModalOpen] = useState(false)
	const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false)
	const { switchToOrganization } = useAuth()
	const navigate = useNavigate()
	const params = useParams({ strict: false })

	// Get organization ID from URL params
	const organizationId = params.orgId as Id<"organizations"> | undefined

	// Get current organization by ID from URL
	const organizationByIdQuery = useQuery(
		organizationId
			? convexQuery(api.organizations.getOrganizationById, { organizationId })
			: { enabled: false }
	)

	// Fall back to session-based query if no URL param
	const organizationFromSessionQuery = useQuery(
		!organizationId ? convexQuery(api.me.getOrganization, {}) : { enabled: false }
	)

	const userOrganizationsQuery = useQuery(convexQuery(api.organizations.getUserOrganizations, {}))

	// Use URL-based org if available, otherwise fall back to session
	const currentOrg = organizationId
		? organizationByIdQuery.data
		: organizationFromSessionQuery.data?.directive === "success"
			? organizationFromSessionQuery.data.data
			: null
	const organizations = userOrganizationsQuery.data || []

	const handleOrganizationSwitch = async (workosOrgId: string) => {
		try {
			// Find the organization to get its Convex ID
			const targetOrg = organizations.find(org => org.workosId === workosOrgId)
			if (targetOrg) {
				// Get the current route path to preserve sub-routes
				const currentPath = window.location.pathname
				const pathSegments = currentPath.split('/')
				
				// Determine which sub-route we're in (if any)
				let targetRoute = `/app/${targetOrg._id}`
				
				// If we're in a sub-route under the org, preserve it
				if (pathSegments.length > 3 && pathSegments[1] === 'app') {
					// Keep everything after /app/$orgId/
					const subPath = pathSegments.slice(3).join('/')
					if (subPath) {
						targetRoute = `/app/${targetOrg._id}/${subPath}`
					}
				}
				
				// Navigate to the new organization path first (this updates the UI immediately)
				await navigate({ to: targetRoute as any })
				
				// Then switch the WorkOS session and reload to sync everything
				await switchToOrganization({ organizationId: workosOrgId })
				
				// Force a reload to ensure session is fully synced
				window.location.reload()
			}
		} catch (error) {
			console.error("Failed to switch organization:", error)
		}
	}

	return (
		<>
			<Dropdown.Root>
				<AriaButton
					className={({ isPressed, isFocusVisible }) =>
						cx(
							"flex h-8 w-full items-center justify-start gap-2 rounded-md p-1 font-medium text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							isPressed && "bg-sidebar-accent text-sidebar-accent-foreground",
							isFocusVisible && "outline-2 outline-focus-ring outline-offset-2",
						)
					}
				>
					<Avatar
						size="xs"
						src={currentOrg?.logoUrl || `https://avatar.vercel.sh/${currentOrg?.workosId}`}
						initials={currentOrg?.name?.slice(0, 2).toUpperCase() || "??"}
						alt={currentOrg?.name || "Organization"}
					/>
					<span className="truncate font-semibold">{currentOrg?.name || "Loading..."}</span>
				</AriaButton>
				<Dropdown.Popover className="w-56">
					<Dropdown.Menu>
						<Dropdown.Section>
							<Dropdown.SectionHeader className="px-2 py-1.5 font-medium text-fg-quaternary text-xs">
								Organizations
							</Dropdown.SectionHeader>
							{organizations.map((org) => (
								<Dropdown.Item
									key={org._id}
									onAction={() => handleOrganizationSwitch(org.workosId)}
								>
									<div className="flex items-center gap-2">
										<Avatar
											size="xs"
											src={org.logoUrl || `https://avatar.vercel.sh/${org.workosId}`}
											initials={org.name.slice(0, 2).toUpperCase()}
											alt={org.name}
										/>
										<span className="truncate text-fg-secondary text-xs">{org.name}</span>
										{currentOrg?._id === org._id && (
											<span className="ml-auto text-fg-quaternary text-xs">✓</span>
										)}
									</div>
								</Dropdown.Item>
							))}
						</Dropdown.Section>
						<Dropdown.Separator />
						<Dropdown.Section>
							<Dropdown.Item
								icon={IconPlusStroke}
								label="Add Organization"
								onAction={() => setCreateOrgModalOpen(true)}
							/>
							<Dropdown.Item
								icon={IconUserPlus1}
								label="Invite People"
								onAction={() => setInviteModalOpen(true)}
							/>
						</Dropdown.Section>
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown.Root>

			<CreateOrganizationModal isOpen={createOrgModalOpen} onOpenChange={setCreateOrgModalOpen} />
			<EmailInviteModal isOpen={inviteModalOpen} onOpenChange={setInviteModalOpen} />
		</>
	)
}
