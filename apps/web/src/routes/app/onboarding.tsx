import { convexQuery } from "@convex-dev/react-query"
import { api } from "@hazel/backend/api"
import { Building02, Users01 } from "@untitledui/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useState } from "react"
import { CreateOrganizationModal } from "~/components/application/modals/create-organization-modal"
import { Button } from "~/components/base/buttons/button"
import { FeaturedIcon } from "~/components/foundations/featured-icon/featured-icons"
import IconMagicWand from "~/components/icons/IconMagicWand"

export const Route = createFileRoute("/app/onboarding")({
	component: OnboardingPage,
})

function OnboardingPage() {
	const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false)
	
	// Check if user already has organizations
	const userOrganizationsQuery = useQuery(convexQuery(api.organizations.getUserOrganizations, {}))
	
	// If user has organizations, redirect to the first one
	if (userOrganizationsQuery.data && userOrganizationsQuery.data.length > 0) {
		const firstOrg = userOrganizationsQuery.data[0]
		return <Navigate to="/app/$orgId" params={{ orgId: firstOrg._id }} />
	}
	
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				{/* Logo/Header */}
				<div className="text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
						<IconMagicWand className="h-8 w-8 text-white" />
					</div>
					<h2 className="mt-6 font-bold text-3xl text-gray-900">
						Welcome to Maki Chat
					</h2>
					<p className="mt-2 text-gray-600 text-sm">
						Let's get you started by creating your first organization
					</p>
				</div>
				
				{/* Features */}
				<div className="rounded-lg bg-white p-6 shadow">
					<div className="space-y-4">
						<div className="flex items-start space-x-3">
							<FeaturedIcon
								icon={Building02}
								color="brand"
								size="md"
								theme="modern"
							/>
							<div className="flex-1">
								<h3 className="font-medium text-gray-900 text-sm">Create Your Organization</h3>
								<p className="mt-1 text-gray-500 text-sm">
									Set up a workspace for your team to collaborate
								</p>
							</div>
						</div>
						
						<div className="flex items-start space-x-3">
							<FeaturedIcon
								icon={Users01}
								color="brand"
								size="md"
								theme="modern"
							/>
							<div className="flex-1">
								<h3 className="font-medium text-gray-900 text-sm">Invite Team Members</h3>
								<p className="mt-1 text-gray-500 text-sm">
									Bring your colleagues into the conversation
								</p>
							</div>
						</div>
					</div>
				</div>
				
				{/* Action Buttons */}
				<div className="space-y-3">
					<Button
						color="primary"
						size="lg"
						className="w-full"
						onClick={() => setCreateOrgModalOpen(true)}
					>
						Create Your First Organization
					</Button>
					
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-gray-300 border-t" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-gray-50 px-2 text-gray-500">Or</span>
						</div>
					</div>
					
					<p className="text-center text-gray-500 text-sm">
						Have an invitation? You'll be able to join once your administrator adds you.
					</p>
				</div>
			</div>
			
			{/* Create Organization Modal */}
			<CreateOrganizationModal
				isOpen={createOrgModalOpen}
				onOpenChange={setCreateOrgModalOpen}
			/>
		</div>
	)
}