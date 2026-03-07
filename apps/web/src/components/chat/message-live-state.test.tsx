import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ACTOR_SERVICE_ERROR_UI_MESSAGE, ACTOR_SERVICE_ERROR_UI_TITLE } from "@hazel/domain"

vi.mock("~/components/icons/icon-brain-sparkle", () => ({
	IconBrainSparkle: () => null,
}))

vi.mock("~/components/icons/icon-sparkles", () => ({
	IconSparkles: () => null,
}))

vi.mock("~/components/icons/icon-warning", () => ({
	IconWarning: () => null,
}))

vi.mock("~/hooks/use-message-actor", () => ({
	useMessageActor: () => ({
		status: "idle",
		data: {},
		text: "",
		isStreaming: false,
		progress: null,
		error: null,
		startedAt: null,
		completedAt: null,
		steps: [],
		currentStepIndex: null,
		isConnected: false,
	}),
}))

vi.mock("~/lib/utils", () => ({
	cn: (...classes: Array<string | undefined | null | false>) => classes.filter(Boolean).join(" "),
}))

vi.mock("./agent-steps-view", () => ({
	AgentSteps: {
		Root: () => null,
	},
}))

vi.mock("./slate-editor/slate-message-viewer", () => ({
	SlateMessageViewer: () => null,
}))

vi.mock("./streaming-markdown", () => ({
	StreamingMarkdown: ({ children }: { children: any }) => <>{children}</>,
}))

import { MessageLive } from "./message-live-state"
import { MessageLiveContext } from "./message-live-context"

function renderError(error: string) {
	return render(
		<MessageLiveContext
			value={{
				state: {
					status: "failed",
					data: {},
					text: "",
					isStreaming: false,
					progress: null,
					error,
					steps: [],
					currentStepIndex: null,
					isConnected: false,
				},
				actions: {},
				meta: {},
			}}
		>
			<MessageLive.Error />
		</MessageLiveContext>,
	)
}

describe("MessageLive.Error", () => {
	it("renders sanitized service error copy for classified actor failures", () => {
		renderError(ACTOR_SERVICE_ERROR_UI_MESSAGE)

		expect(screen.getByRole("alert")).toBeTruthy()
		expect(screen.getByText(ACTOR_SERVICE_ERROR_UI_TITLE)).toBeTruthy()
		expect(screen.getByText(ACTOR_SERVICE_ERROR_UI_MESSAGE)).toBeTruthy()
	})

	it("renders generic copy for non-service errors", () => {
		renderError("Tool execution failed")

		expect(screen.getByText("Something went wrong")).toBeTruthy()
		expect(screen.getByText("Tool execution failed")).toBeTruthy()
	})
})
