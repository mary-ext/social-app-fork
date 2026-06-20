import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { useLingui, Trans } from '@lingui/react/macro';

import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';

import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

export function SubscribeMenu({ list }: { list: AppBskyGraphDefs.ListView }) {
	const { t: l } = useLingui();
	const subscribeMutePromptHandle = Prompt.usePromptHandle();
	const subscribeBlockPromptHandle = Prompt.usePromptHandle();

	const { mutateAsync: muteList, isPending: isMutePending } = useListMuteMutation();
	const { mutateAsync: blockList, isPending: isBlockPending } = useListBlockMutation();

	const isPending = isMutePending || isBlockPending;

	const onSubscribeMute = async () => {
		try {
			await muteList({ uri: list.uri, mute: true });
			Toast.show(l({ message: 'List muted', context: 'toast' }));
		} catch {
			Toast.show(l`There was an issue. Please check your internet connection and try again.`, {
				type: 'error',
			});
		}
	};

	const onSubscribeBlock = async () => {
		try {
			await blockList({ uri: list.uri, block: true });
			Toast.show(l({ message: 'List blocked', context: 'toast' }));
		} catch {
			Toast.show(l`There was an issue. Please check your internet connection and try again.`, {
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
							label={l`Subscribe to this list`}
							size="small"
							color="primary_subtle"
							disabled={isPending}
						>
							{isPending && <ButtonIcon icon={Loader} />}
							<ButtonText>
								<Trans>Subscribe</Trans>
							</ButtonText>
						</Button>
					}
				/>
				<Menu.Popup label={l`Subscribe to this list`} align="end">
					<Menu.Group>
						<Menu.Item label={l`Mute accounts`} onClick={() => subscribeMutePromptHandle.open(null)}>
							<Menu.ItemText>
								<Trans>Mute accounts</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={MuteIcon} />
						</Menu.Item>
						<Menu.Item label={l`Block accounts`} onClick={() => subscribeBlockPromptHandle.open(null)}>
							<Menu.ItemText>
								<Trans>Block accounts</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={PersonXIcon} />
						</Menu.Item>
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
			<Prompt.Basic
				handle={subscribeMutePromptHandle}
				title={l`Mute these accounts?`}
				description={l`Muting is private. Muted accounts can interact with you, but you will not see their posts or receive notifications from them.`}
				onConfirm={() => void onSubscribeMute()}
				confirmButtonCta={l`Mute list`}
			/>
			<Prompt.Basic
				handle={subscribeBlockPromptHandle}
				title={l`Block these accounts?`}
				description={l`Blocking is public. Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`}
				onConfirm={() => void onSubscribeBlock()}
				confirmButtonCta={l`Block list`}
				confirmButtonColor="negative"
			/>
		</>
	);
}
