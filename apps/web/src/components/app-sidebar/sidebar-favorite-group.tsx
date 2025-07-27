import { convexQuery } from "@convex-dev/react-query"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "../ui/sidebar"
import { ChannelItem, DmChannelLink } from "./channel-item"

export const SidebarFavoriteGroup = () => {
	const favoritedChannelsQuery = useQuery(
		convexQuery(api.channels.getChannelsForOrganization, {
			favoriteFilter: {
				favorite: true,
			},
		}),
	)

	// TODO: Add presence state when available
	const userPresenceState = { presenceList: [] }

	const channels = useMemo(
		() => [
			...(favoritedChannelsQuery.data?.dmChannels || []),
			...(favoritedChannelsQuery.data?.organizationChannels || []),
		],
		[favoritedChannelsQuery.data],
	)

	if (channels.length === 0) {
		return null
	}

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Favorites</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{channels.map((channel) => {
						if (channel.type === "private" || channel.type === "public") {
							return <ChannelItem key={channel._id} channel={channel} />
						}
						return (
							<DmChannelLink
								key={channel._id}
								userPresence={userPresenceState.presenceList}
								channel={channel}
							/>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
