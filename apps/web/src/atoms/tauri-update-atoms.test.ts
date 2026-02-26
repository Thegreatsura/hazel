import { Effect } from "effect"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getTauriUpdaterMock = vi.fn()
const getTauriProcessMock = vi.fn()

vi.mock("@hazel/desktop/bridge", () => ({
	getTauriUpdater: getTauriUpdaterMock,
	getTauriProcess: getTauriProcessMock,
}))

describe("tauri-update-atoms", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.resetModules()
	})

	it("checks for updates even when process plugin is unavailable", async () => {
		getTauriUpdaterMock.mockReturnValue({
			check: vi.fn().mockResolvedValue(null),
		})
		getTauriProcessMock.mockReturnValue(undefined)

		const { checkForUpdates } = await import("./tauri-update-atoms")
		const states: Array<{ _tag: string }> = []

		await checkForUpdates((state) => {
			states.push(state as { _tag: string })
		})

		expect(states.map((state) => state._tag)).toEqual(["checking", "not-available"])
	})

	it("falls back to app exit when relaunch fails after install", async () => {
		const relaunch = vi.fn().mockRejectedValue(new Error("relaunch failed"))
		const exit = vi.fn().mockResolvedValue(undefined)
		getTauriUpdaterMock.mockReturnValue({
			check: vi.fn(),
		})
		getTauriProcessMock.mockReturnValue({ relaunch, exit })

		const { createDownloadEffect } = await import("./tauri-update-atoms")

		const update = {
			download: vi.fn(async (onEvent: (event: unknown) => void) => {
				onEvent({ event: "Started", data: { contentLength: 10 } })
				onEvent({ event: "Progress", data: { chunkLength: 10 } })
				onEvent({ event: "Finished", data: {} })
			}),
			install: vi.fn().mockResolvedValue(undefined),
		}

		const states: Array<{ _tag: string; message?: string }> = []
		await Effect.runPromise(
			createDownloadEffect(update as any, (state) => {
				states.push(state as { _tag: string; message?: string })
			}),
		)

		expect(relaunch).toHaveBeenCalledTimes(1)
		expect(exit).toHaveBeenCalledTimes(1)
		expect(states.some((state) => state._tag === "error")).toBe(false)
	})

	it("surfaces a manual restart message when both relaunch and exit fail", async () => {
		const relaunch = vi.fn().mockRejectedValue(new Error("relaunch failed"))
		const exit = vi.fn().mockRejectedValue(new Error("exit failed"))
		getTauriUpdaterMock.mockReturnValue({
			check: vi.fn(),
		})
		getTauriProcessMock.mockReturnValue({ relaunch, exit })

		const { createDownloadEffect } = await import("./tauri-update-atoms")

		const update = {
			download: vi.fn(async (_onEvent: (event: unknown) => void) => {}),
			install: vi.fn().mockResolvedValue(undefined),
		}

		const states: Array<{ _tag: string; message?: string }> = []
		await Effect.runPromise(
			createDownloadEffect(update as any, (state) => {
				states.push(state as { _tag: string; message?: string })
			}),
		)

		expect(relaunch).toHaveBeenCalledTimes(1)
		expect(exit).toHaveBeenCalledTimes(1)
		expect(states.at(-1)).toEqual({
			_tag: "error",
			message:
				"Update installed, but restart failed and Hazel could not quit automatically. Please quit and reopen Hazel manually.",
		})
	})
})
