import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { shareUrl } from '#/lib/sharing';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';

import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as styles from './ShareDialog.css';

type Props = {
	handle: Dialog.DialogHandle;
	imageLoaded?: boolean;
	link?: string;
	starterPack: AppBskyGraphDefs.StarterPackView;
};

export function ShareDialog({ handle, ...props }: Props) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['components.starterPack.share.a11yLabel']()}>
				<ShareDialogInner handle={handle} {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function ShareDialogInner({ handle, imageLoaded, link, starterPack }: Props) {
	const imageUrl = getStarterPackOgCard(starterPack);

	const onShareLink = () => {
		if (!link) return;
		void shareUrl(link);
		handle.close();
	};

	if (!imageLoaded || !link) {
		return (
			<div className={styles.loading}>
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			</div>
		);
	}

	return (
		<Dialog.Stack gap="xl">
			<Dialog.Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['components.starterPack.share.invitePrompt']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastMedium">{m['components.starterPack.share.message']()}</Text>
			</Dialog.Stack>

			<img alt="" className={styles.image} src={imageUrl} />

			<Dialog.Actions align="center" direction="responsive">
				<Button
					color="primary_subtle"
					label={m['common.share.action.copyLink']()}
					onClick={onShareLink}
					size="large"
					variant="solid"
				>
					<ButtonIcon icon={ChainLinkIcon} />
					<ButtonText>{m['common.share.action.copyLink']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Dialog.Stack>
	);
}
