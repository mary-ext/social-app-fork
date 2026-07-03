import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';

import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import * as Menu from '#/components/Menu';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

export function SubscribeMenu({ list }: { list: AppBskyGraphDefs.ListView }) {
	const subscribeMutePromptHandle = Prompt.usePromptHandle();
	const subscribeBlockPromptHandle = Prompt.usePromptHandle();

	const { mutateAsync: muteList, isPending: isMutePending } = useListMuteMutation();
	const { mutateAsync: blockList, isPending: isBlockPending } = useListBlockMutation();

	const isPending = isMutePending || isBlockPending;

	const onSubscribeMute = async () => {
		try {
			await muteList({ uri: list.uri, mute: true });
			Toast.show(m['screens.profileList.mute.mutedToast']());
		} catch {
			Toast.show(m['common.error.issueConnection'](), {
				type: 'error',
			});
		}
	};

	const onSubscribeBlock = async () => {
		try {
			await blockList({ uri: list.uri, block: true });
			Toast.show(m['screens.profileList.block.blockedToast']());
		} catch {
			Toast.show(m['common.error.issueConnection'](), {
				type: 'error',
			});
		}
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							label={m['screens.profileList.subscribe.action.subscribeToList']()}
							size="small"
							color="primary_subtle"
							disabled={isPending}
						>
							{isPending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
							<ButtonText>{m['screens.profileList.subscribe.action.subscribe']()}</ButtonText>
						</Button>
					}
				/>
				<Menu.Popup label={m['screens.profileList.subscribe.action.subscribeToList']()} align="end">
					<Menu.Group>
						<Menu.Item
							label={m['screens.profileList.mute.action.accounts']()}
							onClick={() => subscribeMutePromptHandle.open(null)}
						>
							<Menu.ItemText>{m['screens.profileList.mute.action.accounts']()}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={MuteIcon} />
						</Menu.Item>
						<Menu.Item
							label={m['screens.profileList.block.action.accounts']()}
							onClick={() => subscribeBlockPromptHandle.open(null)}
						>
							<Menu.ItemText>{m['screens.profileList.block.action.accounts']()}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={PersonXIcon} />
						</Menu.Item>
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
			<Prompt.Basic
				handle={subscribeMutePromptHandle}
				title={m['screens.profileList.mute.confirm.title']()}
				description={m['screens.profileList.mute.confirm.message']()}
				onConfirm={() => void onSubscribeMute()}
				confirmButtonCta={m['screens.profileList.mute.action.list']()}
			/>
			<Prompt.Basic
				handle={subscribeBlockPromptHandle}
				title={m['screens.profileList.block.confirm.title']()}
				description={m['screens.profileList.block.confirm.message']()}
				onConfirm={() => void onSubscribeBlock()}
				confirmButtonCta={m['screens.profileList.block.action.list']()}
				confirmButtonColor="negative"
			/>
		</>
	);
}
