import { useAtomSet } from "@effect-atom/atom-react"
import type { BotId } from "@hazel/schema"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"
import {
	type BotData,
	installBotMutation,
	listBotsMutation,
	listInstalledBotsMutation,
	listPublicBotsMutation,
	type PublicBotData,
	uninstallBotMutation,
} from "~/atoms/bot-atoms"
import IconMagnifier from "~/components/icons/icon-magnifier-3"
import IconPlus from "~/components/icons/icon-plus"
import IconRobot from "~/components/icons/icon-robot"
import { CreateBotModal } from "~/components/modals/create-bot-modal"
import { Button } from "~/components/ui/button"
import { EmptyState } from "~/components/ui/empty-state"
import { Input, InputGroup } from "~/components/ui/input"
import { SectionHeader } from "~/components/ui/section-header"
import { Tab, TabList, TabPanel, Tabs } from "~/components/ui/tabs"
import { useAuth } from "~/lib/auth"
import { toastExit } from "~/lib/toast-exit"
import { BotCard } from "~/components/bots/bot-card"
import { MarketplaceBotCard } from "~/components/bots/marketplace-bot-card"

export const Route = createFileRoute("/_app/$orgSlug/settings/bots")({
	component: BotSettings,
})

function BotSettings() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [selectedTab, setSelectedTab] = useState<string>("my-bots")
	const { user } = useAuth()

	// State for each tab's data
	const [myBots, setMyBots] = useState<readonly BotData[]>([])
	const [installedBots, setInstalledBots] = useState<readonly BotData[]>([])
	const [publicBots, setPublicBots] = useState<readonly PublicBotData[]>([])
	const [search, setSearch] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	// Mutations
	const listBots = useAtomSet(listBotsMutation, { mode: "promiseExit" })
	const listInstalled = useAtomSet(listInstalledBotsMutation, { mode: "promiseExit" })
	const listPublic = useAtomSet(listPublicBotsMutation, { mode: "promiseExit" })
	const installBot = useAtomSet(installBotMutation, { mode: "promiseExit" })
	const uninstallBot = useAtomSet(uninstallBotMutation, { mode: "promiseExit" })

	// Fetch my bots
	const fetchMyBots = useCallback(async () => {
		const exit = await listBots({ payload: {} })
		if (exit._tag === "Success") {
			setMyBots(exit.value.data)
		}
	}, [listBots])

	// Fetch installed bots
	const fetchInstalledBots = useCallback(async () => {
		const exit = await listInstalled({ payload: {} })
		if (exit._tag === "Success") {
			setInstalledBots(exit.value.data)
		}
	}, [listInstalled])

	// Fetch public bots
	const fetchPublicBots = useCallback(
		async (searchQuery?: string) => {
			setIsLoading(true)
			const exit = await listPublic({ payload: { search: searchQuery || undefined } })
			if (exit._tag === "Success") {
				setPublicBots(exit.value.data)
			}
			setIsLoading(false)
		},
		[listPublic],
	)

	// Initial fetch based on selected tab
	useEffect(() => {
		if (selectedTab === "my-bots") {
			fetchMyBots()
		} else if (selectedTab === "installed") {
			fetchInstalledBots()
		} else if (selectedTab === "marketplace") {
			fetchPublicBots(search)
		}
	}, [selectedTab, fetchMyBots, fetchInstalledBots, fetchPublicBots, search])

	// Debounced search for marketplace
	useEffect(() => {
		if (selectedTab !== "marketplace") return

		const timer = setTimeout(() => {
			fetchPublicBots(search)
		}, 300)

		return () => clearTimeout(timer)
	}, [search, selectedTab, fetchPublicBots])

	// Handle bot installation
	const handleInstall = useCallback(
		async (botId: string) => {
			await toastExit(installBot({ payload: { botId: botId as BotId } }), {
				loading: "Installing bot...",
				success: () => {
					fetchPublicBots(search)
					fetchInstalledBots()
					return "Bot installed successfully"
				},
				customErrors: {
					BotNotFoundError: () => ({
						title: "Bot not found",
						description: "This bot may no longer be available.",
						isRetryable: false,
					}),
					BotAlreadyInstalledError: () => ({
						title: "Already installed",
						description: "This bot is already installed in your workspace.",
						isRetryable: false,
					}),
				},
			})
		},
		[installBot, fetchPublicBots, fetchInstalledBots, search],
	)

	// Handle bot uninstallation
	const handleUninstall = useCallback(
		async (botId: string) => {
			await toastExit(uninstallBot({ payload: { botId: botId as BotId } }), {
				loading: "Uninstalling bot...",
				success: () => {
					fetchInstalledBots()
					fetchPublicBots(search)
					return "Bot uninstalled successfully"
				},
				customErrors: {
					BotNotFoundError: () => ({
						title: "Bot not found",
						description: "This bot may have already been uninstalled.",
						isRetryable: false,
					}),
				},
			})
		},
		[uninstallBot, fetchInstalledBots, fetchPublicBots, search],
	)

	// Refresh lists after bot creation
	const handleBotCreated = useCallback(() => {
		fetchMyBots()
		setIsCreateModalOpen(false)
	}, [fetchMyBots])

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-8">
			<SectionHeader.Root className="border-none pb-0">
				<SectionHeader.Group>
					<div className="flex flex-1 flex-col justify-center gap-1">
						<SectionHeader.Heading>Bots</SectionHeader.Heading>
						<SectionHeader.Subheading>
							Create, manage, and install bots for your workspace
						</SectionHeader.Subheading>
					</div>
					<SectionHeader.Actions>
						<Button intent="primary" size="md" onPress={() => setIsCreateModalOpen(true)}>
							<IconPlus data-slot="icon" />
							Create Bot
						</Button>
					</SectionHeader.Actions>
				</SectionHeader.Group>
			</SectionHeader.Root>

			<Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
				<TabList className="w-full">
					<Tab id="my-bots">My Bots</Tab>
					<Tab id="installed">Installed</Tab>
					<Tab id="marketplace">Marketplace</Tab>
				</TabList>

				<TabPanel id="my-bots" className="pt-6">
					<MyBotsSection
						bots={myBots}
						onRefresh={fetchMyBots}
						onCreateClick={() => setIsCreateModalOpen(true)}
					/>
				</TabPanel>

				<TabPanel id="installed" className="pt-6">
					<InstalledBotsSection bots={installedBots} onUninstall={handleUninstall} />
				</TabPanel>

				<TabPanel id="marketplace" className="pt-6">
					<MarketplaceSection
						bots={publicBots}
						search={search}
						onSearchChange={setSearch}
						onInstall={handleInstall}
						isLoading={isLoading}
					/>
				</TabPanel>
			</Tabs>

			<CreateBotModal
				isOpen={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSuccess={handleBotCreated}
			/>
		</div>
	)
}

function MyBotsSection({
	bots,
	onRefresh,
	onCreateClick,
}: {
	bots: readonly BotData[]
	onRefresh: () => void
	onCreateClick: () => void
}) {
	if (bots.length === 0) {
		return (
			<EmptyState
				icon={IconRobot}
				title="No bots yet"
				description="Create your first bot to automate tasks and integrate with external services."
				action={
					<Button intent="primary" onPress={onCreateClick}>
						<IconPlus data-slot="icon" />
						Create Bot
					</Button>
				}
			/>
		)
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{bots.map((bot) => (
				<BotCard key={bot.id} bot={bot} onDelete={onRefresh} onUpdate={onRefresh} />
			))}
		</div>
	)
}

function InstalledBotsSection({
	bots,
	onUninstall,
}: {
	bots: readonly BotData[]
	onUninstall: (botId: string) => void
}) {
	if (bots.length === 0) {
		return (
			<EmptyState
				icon={IconRobot}
				title="No installed bots"
				description="Browse the marketplace to discover and install bots for your workspace."
			/>
		)
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{bots.map((bot) => (
				<BotCard key={bot.id} bot={bot} showUninstall onUninstall={() => onUninstall(bot.id)} />
			))}
		</div>
	)
}

function MarketplaceSection({
	bots,
	search,
	onSearchChange,
	onInstall,
	isLoading,
}: {
	bots: readonly PublicBotData[]
	search: string
	onSearchChange: (value: string) => void
	onInstall: (botId: string) => void
	isLoading: boolean
}) {
	return (
		<div className="flex flex-col gap-6">
			<InputGroup className="max-w-md">
				<IconMagnifier data-slot="icon" />
				<Input
					placeholder="Search bots..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</InputGroup>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
				</div>
			) : bots.length === 0 ? (
				<EmptyState
					icon={IconRobot}
					title="No bots found"
					description={
						search
							? "Try a different search term"
							: "Be the first to publish a bot to the marketplace!"
					}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{bots.map((bot) => (
						<MarketplaceBotCard key={bot.id} bot={bot} onInstall={() => onInstall(bot.id)} />
					))}
				</div>
			)}
		</div>
	)
}
