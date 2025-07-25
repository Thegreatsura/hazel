import { useConvexQuery } from "@convex-dev/react-query"
import { api } from "@hazel/backend/api"
import { createFileRoute } from "@tanstack/react-router"
import { SectionHeader } from "~/components/application/section-headers/section-headers"
import { Form } from "~/components/base/form/form"

import "@radix-ui/themes/styles.css"
import "@workos-inc/widgets/styles.css"

import { Edit01, Plus, Trash01 } from "@untitledui/icons"

import { useState } from "react"
import type { SortDescriptor } from "react-aria-components"
import { PaginationCardDefault } from "~/components/application/pagination/pagination"
import { Table, TableCard } from "~/components/application/table/table"
import { Avatar } from "~/components/base/avatar/avatar"
import type { BadgeColors } from "~/components/base/badges/badge-types"
import { Badge, type BadgeColor, BadgeWithDot } from "~/components/base/badges/badges"
import { Button } from "~/components/base/buttons/button"
import { ButtonUtility } from "~/components/base/buttons/button-utility"
import { EmailInviteModal } from "~/components/application/modals/email-invite-modal"

export const Route = createFileRoute("/app/settings/team")({
	component: RouteComponent,
})

function RouteComponent() {
	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "status",
		direction: "ascending",
	})
	const [showInviteModal, setShowInviteModal] = useState(false)

	const teamMembersQuery = useConvexQuery(api.users.getUsers, {})
	const isLoading = teamMembersQuery === undefined

	const teamMembers =
		teamMembersQuery?.map((user) => ({
			id: user._id,
			name: `${user.firstName} ${user.lastName}`,
			email: `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@company.com`,
			username: `@${user.firstName.toLowerCase()}`,
			avatarUrl: user.avatarUrl,
			status: user.status === "online" ? "Active" : "Offline",
			role: user.role,
		})) || []

	const roleToBadgeColorsMap: Record<string, BadgeColor<"pill-color">> = {
		owner: "brand",
		admin: "pink",
		member: "gray",
	}

	const getInitials = (name: string) => {
		const [firstName, lastName] = name.split(" ")
		return `${firstName.charAt(0)}${lastName.charAt(0)}`
	}

	return (
		<Form
			className="flex flex-col gap-6 px-4 lg:px-8"
			onSubmit={(e) => {
				e.preventDefault()
				const data = Object.fromEntries(new FormData(e.currentTarget))
				console.log("Form data:", data)
			}}
		>
			<SectionHeader.Root>
				<SectionHeader.Group>
					<div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
						<SectionHeader.Heading>Team</SectionHeader.Heading>
						<SectionHeader.Subheading>
							Manage your team members and invite new ones.
						</SectionHeader.Subheading>
					</div>
				</SectionHeader.Group>
			</SectionHeader.Root>

			<TableCard.Root className="rounded-none bg-transparent shadow-none ring-0 lg:rounded-xl lg:bg-primary lg:shadow-xs lg:ring-1">
				<TableCard.Header
					title="Team members"
					description="Manage your team members and their account permissions here."
					className="pb-5"
					badge={
						<Badge color="gray" type="modern" size="sm">
							{teamMembers.length} users
						</Badge>
					}
					contentTrailing={
						<div className="flex gap-3">
							<Button size="md" iconLeading={Plus} onClick={() => setShowInviteModal(true)}>
								Invite user
							</Button>
						</div>
					}
				/>
				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<p className="text-sm text-tertiary">Loading team members...</p>
					</div>
				) : (
					<Table
						aria-label="Team members"
						selectionMode="multiple"
						sortDescriptor={sortDescriptor}
						onSortChange={setSortDescriptor}
						className="bg-primary"
					>
						<Table.Header className="bg-primary">
							<Table.Head id="name" isRowHeader label="Name" allowsSorting className="w-full" />
							<Table.Head id="status" label="Status" allowsSorting />
							<Table.Head id="email" label="Email address" allowsSorting />
							<Table.Head id="role" label="Role" allowsSorting />
							<Table.Head id="actions" />
						</Table.Header>
						<Table.Body items={teamMembers}>
							{(member) => (
								<Table.Row id={member.id} className="odd:bg-secondary_subtle">
									<Table.Cell>
										<div className="flex w-max items-center gap-3">
											<Avatar
												src={member.avatarUrl}
												initials={getInitials(member.name)}
												alt={member.name}
											/>
											<div>
												<p className="font-medium text-primary text-sm">
													{member.name}
												</p>
												<p className="text-sm text-tertiary">{member.username}</p>
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>
										<BadgeWithDot
											color={
												member.status === "Active"
													? "success"
													: member.status === "Offline"
														? "gray"
														: "gray"
											}
											size="sm"
											type="modern"
										>
											{member.status}
										</BadgeWithDot>
									</Table.Cell>
									<Table.Cell>{member.email}</Table.Cell>
									<Table.Cell>
										<Badge
											color={
												roleToBadgeColorsMap[
													member.role as keyof typeof roleToBadgeColorsMap
												] ?? "gray"
											}
											type="pill-color"
											size="sm"
										>
											{member.role.charAt(0).toUpperCase() + member.role.slice(1)}
										</Badge>
									</Table.Cell>

									<Table.Cell className="px-4">
										<div className="flex justify-end gap-0.5">
											<ButtonUtility
												size="xs"
												color="tertiary"
												tooltip="Delete"
												icon={Trash01}
											/>
											<ButtonUtility
												size="xs"
												color="tertiary"
												tooltip="Edit"
												icon={Edit01}
											/>
										</div>
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table>
				)}
				<PaginationCardDefault page={1} total={Math.ceil(teamMembers.length / 10)} />
			</TableCard.Root>
			
			<EmailInviteModal 
				isOpen={showInviteModal}
				onOpenChange={setShowInviteModal}
			/>
		</Form>
	)
}
