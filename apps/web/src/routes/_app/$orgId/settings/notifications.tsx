import { createFileRoute } from "@tanstack/react-router"
import { Bell, BellOff, Monitor, Moon, Volume2, VolumeX } from "@untitledui/icons"
import { useState } from "react"
import { RadioGroup } from "react-aria-components"
import { toast } from "sonner"
import { SectionFooter } from "~/components/application/section-footers/section-footer"
import { SectionHeader } from "~/components/application/section-headers/section-headers"
import { SectionLabel } from "~/components/application/section-headers/section-label"
import { Button } from "~/components/base/buttons/button"
import { Form } from "~/components/base/form/form"
import { Slider } from "~/components/base/slider/slider"
import { Toggle } from "~/components/base/toggle/toggle"
import IconNotificationBellOn from "~/components/icons/IconNotificationBellOn"
import IconVolumeMute1 from "~/components/icons/IconVolumeMute1"
import IconVolumeOne1 from "~/components/icons/IconVolumeOne1"
import { useNotificationSound } from "~/hooks/use-notification-sound"
import { cx } from "~/utils/cx"

export const Route = createFileRoute("/_app/$orgId/settings/notifications")({
	component: NotificationsSettings,
})

function NotificationsSettings() {
	const { settings, updateSettings, testSound } = useNotificationSound()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [desktopNotifications, setDesktopNotifications] = useState(true)
	const [messagePreference, setMessagePreference] = useState<"all" | "mentions" | "none">("all")
	const [doNotDisturb, setDoNotDisturb] = useState(false)
	const [quietHoursStart, setQuietHoursStart] = useState("22:00")
	const [quietHoursEnd, setQuietHoursEnd] = useState("08:00")

	const handleSave = async () => {
		setIsSubmitting(true)
		try {
			// Save settings (in real app, this would be an API call)
			await new Promise((resolve) => setTimeout(resolve, 500))
			toast.success("Notification settings saved")
		} catch (error) {
			toast.error("Failed to save settings")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Form
			className="flex flex-col gap-6 px-4 lg:px-8"
			onSubmit={(e) => {
				e.preventDefault()
				handleSave()
			}}
		>
			<SectionHeader.Root>
				<SectionHeader.Group>
					<div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
						<SectionHeader.Heading>Notifications</SectionHeader.Heading>
						<SectionHeader.Subheading>
							Manage how you receive notifications for messages and mentions.
						</SectionHeader.Subheading>
					</div>
				</SectionHeader.Group>
			</SectionHeader.Root>

			<div className="flex flex-col gap-5">
				{/* Sound Settings Section */}
				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 font-semibold text-lg">Sound Notifications</h3>

					<div className="space-y-6">
						{/* Enable/Disable Sounds */}
						<div className="flex items-center justify-between">
							<Toggle
								label="Enable notification sounds"
								hint="Play a sound when you receive new messages"
								isSelected={settings.enabled}
								onChange={(checked) => updateSettings({ enabled: checked })}
							/>
						</div>

						{/* Sound Selection */}
						<div className="space-y-2">
							<p className="font-medium text-sm">Notification Sound</p>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									color={settings.soundFile === "notification01" ? "primary" : "secondary"}
									onClick={() => updateSettings({ soundFile: "notification01" })}
									isDisabled={!settings.enabled}
								>
									Sound 1
								</Button>
								<Button
									type="button"
									size="sm"
									color={settings.soundFile === "notification02" ? "primary" : "secondary"}
									onClick={() => updateSettings({ soundFile: "notification02" })}
									isDisabled={!settings.enabled}
								>
									Sound 2
								</Button>
								<Button
									type="button"
									size="sm"
									color="secondary"
									onClick={testSound}
									isDisabled={!settings.enabled}
								>
									Test Sound
								</Button>
							</div>
						</div>

						{/* Volume Control */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="font-medium text-sm">Volume</p>
								<span className="text-muted-foreground text-sm">
									{Math.round(settings.volume * 100)}%
								</span>
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									color={settings.volume === 0.25 ? "primary" : "secondary"}
									onClick={() => updateSettings({ volume: 0.25 })}
									isDisabled={!settings.enabled}
									iconLeading={IconVolumeMute1}
								>
									25%
								</Button>
								<Button
									type="button"
									size="sm"
									color={settings.volume === 0.5 ? "primary" : "secondary"}
									onClick={() => updateSettings({ volume: 0.5 })}
									isDisabled={!settings.enabled}
								>
									50%
								</Button>
								<Button
									type="button"
									size="sm"
									color={settings.volume === 0.75 ? "primary" : "secondary"}
									onClick={() => updateSettings({ volume: 0.75 })}
									isDisabled={!settings.enabled}
								>
									75%
								</Button>
								<Button
									type="button"
									size="sm"
									color={settings.volume === 1 ? "primary" : "secondary"}
									onClick={() => updateSettings({ volume: 1 })}
									isDisabled={!settings.enabled}
									iconLeading={IconVolumeOne1}
								>
									100%
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-5">
				<WorkOsWidgets
					theme={{
						appearance: "dark",
						accentColor: "green",
						radius: "medium",
						fontFamily: "Inter",
					}}
				>
					<OrganizationSwitcher
						authToken={getAccessToken}
						switchToOrganization={switchToOrganization}
					>
						{/* <CreateOrganization /> */}
					</OrganizationSwitcher>
					<UserProfile authToken={getAccessToken} />

					<UsersManagement authToken={getAccessToken} />
					<UserSessions authToken={getAccessToken} />
					<UserSecurity authToken={getAccessToken} />
				</WorkOsWidgets>
			</div>
		</Form>
	)
}
