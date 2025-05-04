import { createListCollection } from "@ark-ui/solid"
import { createQuery } from "@rocicorp/zero/solid"
import { Index, createMemo } from "solid-js"
import { IconPlusSmall } from "~/components/icons/plus-small"
import { Avatar } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Dialog } from "~/components/ui/dialog"
import { ListBox } from "~/components/ui/list-box"
import { useZero } from "~/lib/zero/zero-context"

export const CreateDmDialog = () => {
	const z = useZero()
	const friendQuery = z.query.users

	const [friends] = createQuery(() => friendQuery)

	const friendCollection = createMemo(() =>
		createListCollection({
			items: friends(),
			itemToString: (item) => item.displayName,
			itemToValue: (item) => item.tag,
		}),
	)

	return (
		<Dialog>
			<Dialog.Trigger
				class="text-muted-foreground"
				asChild={(props) => (
					<Button intent="ghost" size="icon" {...props}>
						<IconPlusSmall />
					</Button>
				)}
			/>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Select friends</Dialog.Title>
					<Dialog.Description>You can add 10 more friends to this DM.</Dialog.Description>
				</Dialog.Header>
				<div>
					<ListBox id="friendList" collection={friendCollection()} selectionMode="multiple">
						<ListBox.Label>Select your Framework</ListBox.Label>

						<ListBox.Content>
							<Index each={friendCollection().items}>
								{(item) => (
									<ListBox.Item item={item()}>
										<Avatar src={item().avatarUrl} name={item().displayName} />
										<ListBox.ItemText>{item().displayName}</ListBox.ItemText>
										<ListBox.ItemIndicator />
									</ListBox.Item>
								)}
							</Index>
						</ListBox.Content>
					</ListBox>
				</div>
			</Dialog.Content>
		</Dialog>
	)
}
