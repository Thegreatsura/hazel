import { useAtomSet } from "@effect-atom/atom-react"
import { useState } from "react"
import { deleteBotMutation, regenerateBotTokenMutation } from "~/atoms/bot-atoms"
import { BotAvatar } from "~/components/bots/bot-avatar"
import { BotTokenDisplay } from "~/components/bots/bot-token-display"
import IconArrowPath from "~/components/icons/icon-arrow-path"
import IconCode from "~/components/icons/icon-code"
import IconDotsVertical from "~/components/icons/icon-dots-vertical"
import IconEdit from "~/components/icons/icon-edit"
import IconTrash from "~/components/icons/icon-trash"
import { EditBotModal } from "~/components/modals/edit-bot-modal"
import type { BotWithUser } from "~/db/hooks"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "~/components/ui/menu"
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from "~/components/ui/modal"
import { exitToastAsync } from "~/lib/toast-exit"

// Discriminated union for modal state - eliminates 6 separate useState calls
type ModalState =
	| { type: "closed" }
	| { type: "edit" }
	| { type: "delete-confirm"; isDeleting: boolean }
	| { type: "regenerate-confirm"; isRegenerating: boolean; token: string | null }

interface BotCardProps {
	bot: BotWithUser
	showUninstall?: boolean
	onDelete?: () => void
	onUpdate?: () => void
	onUninstall?: () => void
	reactivityKeys?: readonly string[]
}

export function BotCard({
	bot,
	showUninstall,
	onDelete,
	onUpdate,
	onUninstall,
	reactivityKeys,
}: BotCardProps) {
	const [modalState, setModalState] = useState<ModalState>({ type: "closed" })

	const deleteBot = useAtomSet(deleteBotMutation, { mode: "promiseExit" })
	const regenerateToken = useAtomSet(regenerateBotTokenMutation, { mode: "promiseExit" })

	const closeModal = () => setModalState({ type: "closed" })

	const handleDelete = async () => {
		setModalState({ type: "delete-confirm", isDeleting: true })
		await exitToastAsync(deleteBot({ payload: { id: bot.id }, reactivityKeys }))
			.loading("Deleting application...")
			.onSuccess(() => {
				closeModal()
				onDelete?.()
			})
			.successMessage("Application deleted successfully")
			.onErrorTag("BotNotFoundError", () => ({
				title: "Application not found",
				description: "This application may have already been deleted.",
				isRetryable: false,
			}))
			.run()
		setModalState((prev) => (prev.type === "delete-confirm" ? { ...prev, isDeleting: false } : prev))
	}

	const handleRegenerateToken = async () => {
		setModalState({ type: "regenerate-confirm", isRegenerating: true, token: null })
		await exitToastAsync(regenerateToken({ payload: { id: bot.id } }))
			.loading("Regenerating token...")
			.onSuccess((result) =>
				setModalState({ type: "regenerate-confirm", isRegenerating: false, token: result.token }),
			)
			.successMessage("Token regenerated successfully")
			.onErrorTag("BotNotFoundError", () => ({
				title: "Application not found",
				description: "This application may have been deleted.",
				isRetryable: false,
			}))
			.onErrorTag("RateLimitExceededError", () => ({
				title: "Rate limit exceeded",
				description: "Please wait before trying again.",
				isRetryable: true,
			}))
			.run()
		setModalState((prev) =>
			prev.type === "regenerate-confirm" ? { ...prev, isRegenerating: false } : prev,
		)
	}

	// Derived state from discriminated union
	const isDeleteConfirmOpen = modalState.type === "delete-confirm"
	const isRegenerateConfirmOpen = modalState.type === "regenerate-confirm"
	const isEditModalOpen = modalState.type === "edit"
	const isDeleting = modalState.type === "delete-confirm" && modalState.isDeleting
	const isRegenerating = modalState.type === "regenerate-confirm" && modalState.isRegenerating
	const regeneratedToken = modalState.type === "regenerate-confirm" ? modalState.token : null

	const scopeCount = bot.scopes?.length ?? 0

	return (
		<>
			<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-bg transition-all duration-200 hover:border-border-hover hover:shadow-md">
				{/* Header */}
				<div className="flex items-start gap-3 p-4">
					<BotAvatar size="md" bot={bot} className="bg-primary/10" />
					<div className="flex flex-1 flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-fg text-sm">{bot.name}</h3>
							{bot.isPublic && (
								<Badge intent="secondary" size="sm">
									Public
								</Badge>
							)}
						</div>
						{bot.description && (
							<p className="line-clamp-2 text-muted-fg text-xs">{bot.description}</p>
						)}
					</div>

					{/* Actions */}
					{!showUninstall && (
						<Menu>
							<MenuTrigger aria-label="Bot actions">
								<Button
									size="sm"
									intent="plain"
									className="size-8 p-0 hover:bg-secondary"
									aria-label="Bot actions"
								>
									<IconDotsVertical className="size-4" />
								</Button>
							</MenuTrigger>
							<MenuContent placement="bottom end">
								<MenuItem onAction={() => setModalState({ type: "edit" })}>
									<IconEdit data-slot="icon" className="size-4" />
									<MenuLabel>Edit</MenuLabel>
								</MenuItem>
								<MenuItem
									onAction={() =>
										setModalState({
											type: "regenerate-confirm",
											isRegenerating: false,
											token: null,
										})
									}
								>
									<IconArrowPath data-slot="icon" className="size-4" />
									<MenuLabel>Regenerate Token</MenuLabel>
								</MenuItem>
								<MenuSeparator />
								<MenuItem
									onAction={() =>
										setModalState({ type: "delete-confirm", isDeleting: false })
									}
									intent="danger"
								>
									<IconTrash data-slot="icon" className="size-4" />
									<MenuLabel>Delete</MenuLabel>
								</MenuItem>
							</MenuContent>
						</Menu>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-border border-t bg-muted/30 px-4 py-3">
					<div className="flex items-center gap-3 text-muted-fg text-xs">
						<span className="flex items-center gap-1">
							<IconCode className="size-3.5" />
							{scopeCount} {scopeCount === 1 ? "scope" : "scopes"}
						</span>
					</div>

					{showUninstall && (
						<Button size="sm" intent="outline" onPress={onUninstall}>
							Uninstall
						</Button>
					)}
				</div>
			</div>

			{/* Edit Modal */}
			<EditBotModal
				isOpen={isEditModalOpen}
				onOpenChange={(open) => (open ? setModalState({ type: "edit" }) : closeModal())}
				bot={bot}
				onSuccess={onUpdate}
				reactivityKeys={reactivityKeys}
			/>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={isDeleteConfirmOpen}
				onOpenChange={(open) =>
					open ? setModalState({ type: "delete-confirm", isDeleting: false }) : closeModal()
				}
			>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>Delete Application</ModalTitle>
						<ModalDescription>
							Are you sure you want to delete "{bot.name}"? This action cannot be undone.
						</ModalDescription>
					</ModalHeader>
					<ModalFooter>
						<Button intent="outline" onPress={closeModal}>
							Cancel
						</Button>
						<Button intent="danger" onPress={handleDelete} isDisabled={isDeleting}>
							{isDeleting ? "Deleting..." : "Delete Application"}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Regenerate Token Confirmation Modal */}
			<Modal isOpen={isRegenerateConfirmOpen} onOpenChange={(open) => !open && closeModal()}>
				<ModalContent size="lg">
					<ModalHeader>
						<ModalTitle>
							{regeneratedToken ? "New Token Generated" : "Regenerate Token"}
						</ModalTitle>
						<ModalDescription>
							{regeneratedToken
								? "Save this new token now. The old token has been invalidated."
								: "This will invalidate the current token. The application will need to be updated with the new token."}
						</ModalDescription>
					</ModalHeader>
					<ModalBody>
						{regeneratedToken ? (
							<BotTokenDisplay token={regeneratedToken} />
						) : (
							<p className="text-muted-fg text-sm">
								Any applications using the current token will stop working immediately.
							</p>
						)}
					</ModalBody>
					<ModalFooter>
						{regeneratedToken ? (
							<Button intent="primary" onPress={closeModal}>
								Done
							</Button>
						) : (
							<>
								<Button intent="outline" onPress={closeModal}>
									Cancel
								</Button>
								<Button
									intent="danger"
									onPress={handleRegenerateToken}
									isDisabled={isRegenerating}
								>
									{isRegenerating ? "Regenerating..." : "Regenerate Token"}
								</Button>
							</>
						)}
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	)
}
