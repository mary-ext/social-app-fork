import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { shareUrl } from '#/lib/sharing';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';

import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Loader } from '#/components/Loader';
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
				<Dialog.Close />
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
				<Loader size="xl" />
			</div>
		);
	}

	return (
		<div className={styles.content}>
			<div className={styles.header}>
				<Text size="_2xl" weight="semiBold">
					{m['components.starterPack.share.invitePrompt']()}
				</Text>
				<Text color="textContrastMedium" size="md">
					{m['components.starterPack.share.message']()}
				</Text>
			</div>
			<img alt="" className={styles.image} src={imageUrl} />
			<div className={styles.actions}>
				<Button
					color="primary_subtle"
					label={m['common.share.action.copyLink']()}
					onClick={onShareLink}
					size="large"
					variant="solid"
				>
					<ButtonIcon icon={ChainLinkIcon} />
					<ButtonText>{m['components.starterPack.share.copyLink']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}
