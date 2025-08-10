import type { Id } from "@hazel/backend"
import { useParams } from "@tanstack/react-router"
import { Attachment01, FaceSmile, XClose } from "@untitledui/icons"
import { useRef, useState } from "react"
import { useFileUpload } from "~/hooks/use-file-upload"
import { cx } from "~/utils/cx"
import { Button } from "../base/buttons/button"
import { ButtonUtility } from "../base/buttons/button-utility"

interface MessageComposerActionsProps {
	attachmentIds: Id<"attachments">[]
	setAttachmentIds: (ids: Id<"attachments">[]) => void
	onSubmit?: () => Promise<void>
}

export const MessageComposerActions = ({
	attachmentIds,
	setAttachmentIds,
	onSubmit,
}: MessageComposerActionsProps) => {
	const { orgId } = useParams({ from: "/_app/$orgId" })
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [showUploadProgress, setShowUploadProgress] = useState(false)

	const { uploadFiles, uploads, clearUploads, isUploading } = useFileUpload({
		organizationId: orgId as Id<"organizations">,
		onUploadComplete: (attachmentId) => {
			setAttachmentIds([...attachmentIds, attachmentId])
		},
	})

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (files && files.length > 0) {
			setShowUploadProgress(true)
			await uploadFiles(files)
		}
		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const handleRemoveAttachment = (attachmentId: Id<"attachments">) => {
		setAttachmentIds(attachmentIds.filter((id) => id !== attachmentId))
	}

	const handleSubmit = async () => {
		if (onSubmit) {
			await onSubmit()
			// Clear uploads UI after successful send
			clearUploads()
			setShowUploadProgress(false)
		}
	}

	return (
		<>
			{/* Upload Progress */}
			{showUploadProgress && uploads.length > 0 && (
				<div className="absolute right-0 bottom-full left-0 mx-3 mb-2">
					<div className="rounded-lg bg-primary p-2 ring-1 ring-secondary ring-inset">
						<div className="mb-1 flex items-center justify-between">
							<span className="font-medium text-secondary text-xs">Uploading files...</span>
							<ButtonUtility
								icon={XClose}
								size="xs"
								color="tertiary"
								onClick={() => setShowUploadProgress(false)}
							/>
						</div>
						<div className="space-y-1">
							{uploads.map((upload) => (
								<div key={upload.fileId} className="flex items-center gap-2">
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<span className="max-w-[200px] truncate text-tertiary text-xs">
												{upload.fileName}
											</span>
											<span className="text-quaternary text-xs">
												{upload.progress}%
											</span>
										</div>
										<div className="mt-0.5 h-1 overflow-hidden rounded-full bg-secondary">
											<div
												className={cx(
													"h-full transition-all duration-300",
													upload.status === "complete" ? "bg-success" : "bg-brand",
													upload.status === "failed" && "bg-error",
												)}
												style={{ width: `${upload.progress}%` }}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Attached Files Preview */}
			{attachmentIds.length > 0 && (
				<div className="absolute right-0 bottom-full left-0 mx-3 mb-2">
					<div className="flex flex-wrap gap-2">
						{attachmentIds.map((attachmentId) => {
							const upload = uploads.find((u) => u.attachmentId === attachmentId)
							const fileName = upload?.fileName || "File"
							return (
								<div
									key={attachmentId}
									className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1"
								>
									<Attachment01 className="size-3 text-fg-quaternary" />
									<span className="text-secondary text-xs">{fileName}</span>
									<ButtonUtility
										icon={XClose}
										size="xs"
										color="tertiary"
										onClick={() => handleRemoveAttachment(attachmentId)}
									/>
								</div>
							)
						})}
					</div>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				multiple
				className="hidden"
				onChange={handleFileSelect}
				accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
			/>

			<div className="absolute right-3.5 bottom-2 flex items-center gap-2">
				<div className="flex items-center gap-0.5">
					<ButtonUtility
						icon={Attachment01}
						size="xs"
						color="tertiary"
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
					/>
					<ButtonUtility icon={FaceSmile} size="xs" color="tertiary" />
				</div>

				<Button size="sm" color="link-color" onClick={handleSubmit} disabled={isUploading}>
					Send
				</Button>
			</div>
		</>
	)
}
