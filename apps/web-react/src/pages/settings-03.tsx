import {
	BarChartSquare02,
	Folder,
	HomeLine,
	LayoutAlt01,
	Mail01,
	MessageChatCircle,
	PieChart03,
	Rows01,
	SearchLg,
	Settings01,
} from "@untitledui/icons"
import { useState } from "react"
import { SidebarNavigationSectionDividers } from "@/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers"
import { SectionFooter } from "@/components/application/section-footers/section-footer"
import { SectionHeader } from "@/components/application/section-headers/section-headers"
import { SectionLabel } from "@/components/application/section-headers/section-label"
import { TabList, Tabs } from "@/components/application/tabs/tabs"
import { Avatar } from "@/components/base/avatar/avatar"
import { BadgeWithDot } from "@/components/base/badges/badges"
import { Button } from "@/components/base/buttons/button"
import { Checkbox } from "@/components/base/checkbox/checkbox"
import { FileTrigger } from "@/components/base/file-upload-trigger/file-upload-trigger"
import { Form } from "@/components/base/form/form"
import { Input, InputBase, TextField } from "@/components/base/input/input"
import { InputGroup } from "@/components/base/input/input-group"
import { Label } from "@/components/base/input/label"
import { NativeSelect } from "@/components/base/select/select-native"
import { TextEditor } from "@/components/base/text-editor/text-editor"

export const Settings03 = () => {
	const [selectedTab, setSelectedTab] = useState<string>("profile")
	const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(
		"https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80",
	)

	const handleAvatarUpload = (files: FileList | null) => {
		const file = files?.[0]

		if (!file) return

		console.log("File uploaded:", file)
		setUploadedAvatar(URL.createObjectURL(file))
	}

	const tabs = [
		{ id: "details", label: "My details" },
		{ id: "profile", label: "Profile" },
		{ id: "password", label: "Password" },
		{ id: "team", label: "Team" },
		{ id: "plan", label: "Plan" },
		{ id: "billing", label: "Billing" },
		{ id: "email", label: "Email" },
		{ id: "notifications", label: "Notifications", badge: 2 },
		{ id: "integrations", label: "Integrations" },
		{ id: "api", label: "API" },
	]

	return (
		<main className="min-w-0 flex-1 bg-primary pt-8 pb-12">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-5 px-4 lg:px-8">
					{/* Page header simple with search */}
					<div className="relative flex flex-col gap-5">
						<div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
							<div className="flex flex-col gap-0.5 lg:gap-1">
								<h1 className="font-semibold text-primary text-xl lg:text-display-xs">
									Settings
								</h1>
							</div>
							<div className="flex flex-col gap-4 lg:flex-row">
								<Input
									className="lg:w-80"
									size="sm"
									shortcut
									aria-label="Search"
									placeholder="Search"
									icon={SearchLg}
								/>
							</div>
						</div>
					</div>

					<div className="md:hidden">
						<NativeSelect
							value={selectedTab}
							onChange={(event) => setSelectedTab(event.target.value)}
							options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
						/>
					</div>
					<div className="-mx-4 scrollbar-hide lg:-mx-8 hidden overflow-auto px-4 md:flex lg:px-8">
						<Tabs
							className="xl:w-full"
							selectedKey={selectedTab}
							onSelectionChange={(value) => setSelectedTab(value as string)}
						>
							<TabList type="button-border" className="w-full" items={tabs} />
						</Tabs>
					</div>
				</div>
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
								<SectionHeader.Heading>Profile</SectionHeader.Heading>
								<SectionHeader.Subheading>
									Update your photo and personal details here.
								</SectionHeader.Subheading>
							</div>
						</SectionHeader.Group>
					</SectionHeader.Root>

					{/* Form content */}
					<div className="flex flex-col gap-5">
						<div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
							<SectionLabel.Root
								isRequired
								size="sm"
								title="Username"
								className="max-lg:hidden"
							/>

							<InputGroup
								isRequired
								size="md"
								label="Username"
								name="username"
								defaultValue="olivia"
								className="lg:[&_[data-label]]:hidden"
								leadingAddon={<InputGroup.Prefix>untitledui.com/</InputGroup.Prefix>}
							>
								<InputBase />
							</InputGroup>
						</div>

						<hr className="h-px w-full border-none bg-border-secondary" />

						<div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
							<SectionLabel.Root
								isRequired
								size="sm"
								title="Website"
								className="max-lg:hidden"
							/>

							<InputGroup
								isRequired
								size="md"
								label="Website"
								name="website"
								defaultValue="www.untitledui.com"
								className="lg:[&_[data-label]]:hidden"
								leadingAddon={<InputGroup.Prefix>http://</InputGroup.Prefix>}
							>
								<InputBase />
							</InputGroup>
						</div>

						<hr className="h-px w-full border-none bg-border-secondary" />

						<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
							<SectionLabel.Root
								isRequired
								size="sm"
								title="Your photo"
								description="This will be displayed on your profile."
							/>
							<div className="flex justify-between">
								<Avatar size="2xl" src={uploadedAvatar} />

								<div className="flex gap-4">
									<Button
										color="link-gray"
										size="sm"
										onClick={() => setUploadedAvatar(null)}
									>
										Delete
									</Button>
									<FileTrigger
										acceptedFileTypes={["image/*"]}
										onSelect={handleAvatarUpload}
									>
										<Button color="link-color" size="sm">
											Update
										</Button>
									</FileTrigger>
								</div>
							</div>
						</div>

						<hr className="h-px w-full border-none bg-border-secondary" />

						<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
							<SectionLabel.Root
								isRequired
								size="sm"
								title="Your bio"
								description="Write a short introduction."
								tooltip="This will be public"
							/>

							<TextEditor.Root
								limit={400}
								className="gap-2"
								inputClassName="min-h-57 md:min-h-43 p-4 resize-y"
								content="I'm a Product Designer based in Melbourne, Australia. I specialize in UX/UI design, brand strategy, and Webflow development."
							>
								<TextEditor.Toolbar />

								<div className="flex flex-col gap-1.5">
									<TextEditor.Content />
									<TextEditor.HintText />
								</div>
							</TextEditor.Root>
						</div>

						<hr className="h-px w-full border-none bg-border-secondary" />

						<div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
							<SectionLabel.Root size="sm" title="Job title" className="max-lg:hidden" />

							<div className="flex flex-col gap-4">
								<TextField name="role" defaultValue="Product Designer">
									<Label className="lg:hidden">Job title</Label>
									<InputBase size="md" />
								</TextField>

								<Checkbox label="Show my job title in my profile" defaultSelected />
							</div>
						</div>

						<hr className="h-px w-full border-none bg-border-secondary" />

						<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
							<SectionLabel.Root
								size="sm"
								title="Alternative contact email"
								description="Enter an alternative email if you'd like to be contacted via a different email."
							/>

							<TextField aria-label="Alternative contact email" name="email" type="email">
								<InputBase size="md" placeholder="you@example.com" icon={Mail01} />
							</TextField>
						</div>
					</div>

					<SectionFooter.Root className="-mt-1 lg:mt-0">
						<SectionFooter.Actions>
							<Button color="secondary" size="md">
								Cancel
							</Button>
							<Button type="submit" color="primary" size="md">
								Save
							</Button>
						</SectionFooter.Actions>
					</SectionFooter.Root>
				</Form>
			</div>
		</main>
	)
}
