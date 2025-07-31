import {
	Copy01,
	DotsVertical,
	Edit04,
	Flag01,
	Mail01,
	MessageSquare02,
	Plus,
	Share06,
	Stars02,
	Trash01,
} from "@untitledui/icons"
import type { FunctionReturnType } from "convex/server"
import { MenuTrigger } from "react-aria-components"
import type { api } from "@hazel/backend/api"
import { Button } from "../base/buttons/button"
import { Dropdown } from "../base/dropdown/dropdown"

type Message = FunctionReturnType<typeof api.messages.getMessages>["page"][0]

interface MessageToolbarProps {
	message: Message
	isOwnMessage: boolean
	onReaction: (emoji: string) => void
	onEdit: () => void
	onDelete: () => void
	onCopy: () => void
	onReply?: () => void
	onForward?: () => void
	onMarkUnread?: () => void
	onPin?: () => void
	onReport?: () => void
	onViewDetails?: () => void
}

export function MessageToolbar({
	message,
	isOwnMessage,
	onReaction,
	onEdit,
	onDelete,
	onCopy,
	onReply,
	onForward,
	onMarkUnread,
	onPin,
	onReport,
	onViewDetails,
}: MessageToolbarProps) {
	const commonEmojis = ["👍", "❤️", "😂", "🎉", "🤔", "👎"]

	return (
		<div className="absolute right-2 top-0 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
			<div className="flex items-center gap-px rounded-lg border border-border bg-primary shadow-sm">
				{/* Quick Reactions */}
				{commonEmojis.slice(0, 3).map((emoji) => (
					<Button
						key={emoji}
						size="sm"
						color="tertiary"
						onClick={() => onReaction(emoji)}
						aria-label={`React with ${emoji}`}
						className="!p-1.5 hover:bg-secondary"
					>
						{emoji}
					</Button>
				))}

				{/* More Reactions Dropdown */}
				<Dropdown.Root>
					<MenuTrigger>
						<Button
							size="sm"
							color="tertiary"
							aria-label="More reactions"
							className="!p-1.5 hover:bg-secondary"
						>
							<Plus className="size-3.5" />
						</Button>
					</MenuTrigger>
					<Dropdown.Popover placement="bottom end">
						<Dropdown.Menu>
							{commonEmojis.map((emoji) => (
								<Dropdown.Item key={emoji} onAction={() => onReaction(emoji)}>
									<span className="text-lg">{emoji}</span>
								</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown.Popover>
				</Dropdown.Root>

				{/* Divider */}
				<div className="mx-0.5 h-4 w-px bg-border" />

				{/* Action Buttons */}
				<Button
					size="sm"
					color="tertiary"
					onClick={onCopy}
					aria-label="Copy message"
					className="!p-1.5 hover:bg-secondary"
				>
					<Copy01 className="size-3.5" />
				</Button>

				{isOwnMessage && (
					<>
						<Button
							size="sm"
							color="tertiary"
							onClick={onEdit}
							aria-label="Edit message"
							className="!p-1.5 hover:bg-secondary"
						>
							<Edit04 className="size-3.5" />
						</Button>

						<Button
							size="sm"
							color="tertiary-destructive"
							onClick={onDelete}
							aria-label="Delete message"
							className="!p-1.5 hover:bg-error-primary"
						>
							<Trash01 className="size-3.5" />
						</Button>
					</>
				)}

				{/* Divider before more options */}
				<div className="mx-0.5 h-4 w-px bg-border" />

				{/* More Options Dropdown */}
				<Dropdown.Root>
					<MenuTrigger>
						<Button
							size="sm"
							color="tertiary"
							aria-label="More options"
							className="!p-1.5 hover:bg-secondary"
						>
							<DotsVertical className="size-3.5" />
						</Button>
					</MenuTrigger>
					<Dropdown.Popover placement="bottom end">
						<Dropdown.Menu>
							{onReply && (
								<Dropdown.Item
									onAction={onReply}
									icon={MessageSquare02}
									label="Reply in thread"
								/>
							)}
							{onForward && (
								<Dropdown.Item onAction={onForward} icon={Share06} label="Forward message" />
							)}
							{onMarkUnread && (
								<Dropdown.Item onAction={onMarkUnread} icon={Mail01} label="Mark as unread" />
							)}
							{onPin && <Dropdown.Item onAction={onPin} icon={Stars02} label="Pin message" />}

							<Dropdown.Separator />

							{!isOwnMessage && onReport && (
								<Dropdown.Item onAction={onReport} icon={Flag01} label="Report message" />
							)}
							{onViewDetails && (
								<Dropdown.Item onAction={onViewDetails} label="View details" addon="⌘I" />
							)}
						</Dropdown.Menu>
					</Dropdown.Popover>
				</Dropdown.Root>
			</div>
		</div>
	)
}
