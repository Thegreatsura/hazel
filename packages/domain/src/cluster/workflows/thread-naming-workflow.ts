import { Workflow } from "@effect/workflow"
import { ChannelId, MessageId } from "@hazel/schema"
import { ThreadNamingWorkflowError } from "../activities/thread-naming-activities"

// Thread naming workflow - triggered when a thread reaches 3 messages
// Generates a concise, descriptive name for the thread using AI
export const ThreadNamingWorkflow = Workflow.make({
	name: "ThreadNamingWorkflow",
	payload: {
		threadChannelId: ChannelId,
		originalMessageId: MessageId,
	},
	error: ThreadNamingWorkflowError,
})

export type ThreadNamingWorkflowPayload = typeof ThreadNamingWorkflow.payloadSchema.Type
