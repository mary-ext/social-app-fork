import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';

import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Menu from '#/components/web/Menu';
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
			Toast.show(m['screens.profileList.toast.muted']());
		} catch {
			Toast.show(m['common.error.issueConnection'](), {
				type: 'error',
			});
		}
	};

	const onSubscribeBlock = async () => {
		try {
			await blockList({ uri: list.uri, block: true });
			Toast.show(m['screens.profileList.toast.blocked']());
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
							label={m['screens.profileList.action.subscribeToList']()}
							size="small"
							color="primary_subtle"
							disabled={isPending}
						>
							{isPending && <ButtonIcon icon={Loader} />}
							<ButtonText>{m['screens.profileList.action.subscribe']()}</ButtonText>
						</Button>
					}
				/>
				<Menu.Popup label={m['screens.profileList.action.subscribeToList']()} align="end">
					<Menu.Group>
						<Menu.Item
							label={m['screens.profileList.action.muteAccounts']()}
							onClick={() => subscribeMutePromptHandle.open(null)}
						>
							<Menu.ItemText>{m['screens.profileList.action.muteAccounts']()}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={MuteIcon} />
						</Menu.Item>
						<Menu.Item
							label={m['screens.profileList.action.blockAccounts']()}
							onClick={() => subscribeBlockPromptHandle.open(null)}
						>
							<Menu.ItemText>{m['screens.profileList.action.blockAccounts']()}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={PersonXIcon} />
						</Menu.Item>
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
			<Prompt.Basic
				handle={subscribeMutePromptHandle}
				title={m['screens.profileList.dialog.muteConfirmTitle']()}
				description={m['screens.profileList.dialog.muteDescription']()}
				onConfirm={() => void onSubscribeMute()}
				confirmButtonCta={m['screens.profileList.action.muteList']()}
			/>
			<Prompt.Basic
				handle={subscribeBlockPromptHandle}
				title={m['screens.profileList.dialog.blockConfirmTitle']()}
				description={m['screens.profileList.dialog.blockDescription']()}
				onConfirm={() => void onSubscribeBlock()}
				confirmButtonCta={m['screens.profileList.action.blockList']()}
				confirmButtonColor="negative"
			/>
		</>
	);
}
