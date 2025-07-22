import { User01 } from "@untitledui/icons"
import { useEffect, useState } from "react"
import { DialogTrigger as AriaDialogTrigger, Heading as AriaHeading } from "react-aria-components"
import { Dialog, Modal, ModalOverlay } from "~/components/application/modals/modal"
import { Button } from "~/components/base/buttons/button"
import { CloseButton } from "~/components/base/buttons/close-button"
import { Input } from "~/components/base/input/input"
import { Select } from "~/components/base/select/select"
import { IconDoorOpen, IconHashtagStroke, IconPlusStroke } from "~/components/icons"
import { IconButton } from "~/components/ui/button"

export const NewProjectModal = () => {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
			<IconButton className="size-4.5">
				<IconPlusStroke />
			</IconButton>

			<ModalOverlay isDismissable>
				<Modal>
					<Dialog>
						<div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl transition-all sm:max-w-120">
							<CloseButton
								onClick={() => setIsOpen(false)}
								theme="light"
								size="lg"
								className="absolute top-3 right-3"
							/>
							<div className="flex flex-col gap-0.5 px-4 pt-5 pb-5 sm:px-6 sm:pt-6">
								<AriaHeading slot="title" className="font-semibold text-md text-primary">
									Create a new Channel
								</AriaHeading>
								<p className="text-sm text-tertiary">
									Give your channel a name and type to create a new channel.
								</p>
							</div>

							<div className="mt-4 flex flex-col gap-4 px-4 sm:px-6 md:mt-5">
								<Input
									label="Channel Name"
									size="sm"
									placeholder="general"
									icon={IconHashtagStroke}
								/>
								<Select
									label="Channel Type"
									size="sm"
									placeholderIcon={User01}
									defaultSelectedKey="public"
									items={[
										{
											id: "public",
											label: "Public",
											icon: IconDoorOpen,
											avatarUrl:
												"https://www.untitledui.com/logos/images/Ephemeral.jpg",
										},
										{
											id: "private",
											label: "Private",
											avatarUrl:
												"https://www.untitledui.com/logos/images/Watchtower.jpg",
										},
									]}
								>
									{(item) => (
										<Select.Item
											id={item.id}
											avatarUrl={item.avatarUrl}
											supportingText={item.supportingText}
										>
											{item.label}
										</Select.Item>
									)}
								</Select>
							</div>

							<div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 sm:flex-row-reverse sm:items-center sm:px-6 sm:pt-8 sm:pb-6">
								<Button color="primary" size="lg" onClick={() => setIsOpen(false)}>
									Create project
								</Button>
							</div>
						</div>
					</Dialog>
				</Modal>
			</ModalOverlay>
		</AriaDialogTrigger>
	)
}
