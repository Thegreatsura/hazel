import { DotsHorizontal } from "@untitledui/icons"
import {
	Button,
	DialogTrigger,
	Link,
	Dialog as PrimitiveDialog,
} from "react-aria-components"
import { Avatar } from "~/components/base/avatar/avatar"
import { Button as StyledButton } from "~/components/base/buttons/button"
import { ButtonUtility } from "~/components/base/buttons/button-utility"
import { Dropdown } from "~/components/base/dropdown/dropdown"
import { Popover } from "~/components/base/select/popover"
import { TextArea } from "~/components/base/textarea/textarea"
import { Tooltip } from "~/components/base/tooltip/tooltip"
import IconPencilEdit from "~/components/icons/IconPencilEdit"
import IconUserPlusStroke from "~/components/icons/IconUserPlusStroke"

interface UserProfilePopoverProps {
	user: {
		firstName: string
		lastName: string
		email?: string
		avatarUrl?: string
	}
	isOwnProfile: boolean
	onInviteToChannel: () => void
	onEditProfile?: () => void
	onViewFullProfile?: () => void
	onIgnore?: () => void
	onBlock?: () => void
	onReportUser?: () => void
	onCopyUserId?: () => void
}

export function UserProfilePopover({
	user,
	isOwnProfile,
	onInviteToChannel,
	onEditProfile,
	onViewFullProfile,
	onIgnore,
	onBlock,
	onReportUser,
	onCopyUserId,
}: UserProfilePopoverProps) {
	const fullName = `${user.firstName} ${user.lastName}`

	return (
		<DialogTrigger>
			<Button className="outline-hidden">
				<Avatar size="md" alt={fullName} src={user.avatarUrl} />
			</Button>
			<Popover
				className="max-h-96! w-72 bg-secondary py-0 lg:w-80"
				size="md"
				offset={16}
				crossOffset={10}
				placement="right top"
			>
				<PrimitiveDialog className="outline-hidden">
					{({ close }) => (
						<>
							{/* user background image */}
							<div className="relative h-32">
								{!isOwnProfile && (
									<div className="absolute top-2 right-2 flex items-center gap-2 p-1">
										<Tooltip
											arrow
											title="Invite user to specific channel"
											placement="bottom"
										>
											<ButtonUtility
												onClick={() => {
													close()
													onInviteToChannel()
												}}
												color="tertiary"
												size="xs"
												icon={IconUserPlusStroke}
												aria-label="Invite user to specific channel"
											/>
										</Tooltip>

										<Dropdown.Root>
											<ButtonUtility
												className="group"
												color="tertiary"
												size="xs"
												icon={DotsHorizontal}
												aria-label="More"
											/>

											<Dropdown.Popover className="w-40">
												<Dropdown.Menu>
													<Dropdown.Section>
														<Dropdown.Item onAction={onViewFullProfile}>
															View full profile
														</Dropdown.Item>
													</Dropdown.Section>
													<Dropdown.Separator />
													<Dropdown.Section>
														<Dropdown.Item onAction={onIgnore}>Ignore</Dropdown.Item>
														<Dropdown.Item onAction={onBlock}>Block</Dropdown.Item>
														<Dropdown.Item onAction={onReportUser}>
															Report user profile
														</Dropdown.Item>
													</Dropdown.Section>
													<Dropdown.Separator />
													<Dropdown.Item onAction={onCopyUserId}>Copy user ID</Dropdown.Item>
												</Dropdown.Menu>
											</Dropdown.Popover>
										</Dropdown.Root>
									</div>
								)}
							</div>

							<div className="inset-shadow-2xs inset-shadow-gray-500/15 rounded-t-lg bg-tertiary p-4">
								<div className="-mt-12">
									<Avatar
										size="xl"
										className="inset-ring inset-ring-tertiary ring-6 ring-bg-primary"
										alt={fullName}
										src={user.avatarUrl}
									/>
									<div className="mt-3 flex flex-col">
										<span className="font-semibold">
											{user ? fullName : "Unknown"}
										</span>
										<span className="text-secondary text-xs">{user?.email}</span>
									</div>
								</div>
								<div className="mt-4 flex flex-col gap-y-4">
									<div className="flex items-center gap-2">
										<div className="-space-x-2 flex">
											<Avatar
												size="xs"
												alt="Orlando Diggs"
												className="ring-[1.5px] ring-bg-primary"
												src="https://www.untitledui.com/images/avatars/orlando-diggs?fm=webp&q=80"
											/>
											<Avatar
												size="xs"
												alt="Andi Lane"
												className="ring-[1.5px] ring-bg-primary"
												src="https://www.untitledui.com/images/avatars/andi-lane?fm=webp&q=80"
											/>
											<Avatar
												size="xs"
												alt="Kate Morrison"
												className="ring-[1.5px] ring-bg-primary"
												src="https://www.untitledui.com/images/avatars/kate-morrison?fm=webp&q=80"
											/>
											<Avatar
												size="xs"
												className="ring-[1.5px] ring-bg-primary"
												placeholder={
													<span className="flex items-center justify-center font-semibold text-quaternary text-sm">
														+5
													</span>
												}
											/>
										</div>
										<Link href="#" className="text-secondary text-sm/6 hover:underline">
											mutual channels
										</Link>
									</div>
									<div className="flex items-center gap-2">
										{isOwnProfile ? (
											<StyledButton
												size="sm"
												className="w-full"
												iconLeading={IconPencilEdit}
												onClick={onEditProfile}
											>
												Edit profile
											</StyledButton>
										) : (
											<TextArea
												aria-label="Message"
												placeholder={`Message @${user?.firstName}`}
												className="resize-none"
											/>
										)}
									</div>
								</div>
							</div>
						</>
					)}
				</PrimitiveDialog>
			</Popover>
		</DialogTrigger>
	)
}