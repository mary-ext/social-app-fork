import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { getStarterPackOgCard } from '#/lib/starter-pack';

import * as Dialog from '#/components/Dialog';
import { EmbedThumb } from '#/components/EmbedThumb';
import { shareUrl } from '#/components/sharing';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import ChainLinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './ShareDialog.css';

type Props = {
	handle: Dialog.DialogHandle;
	link: string;
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

function ShareDialogInner({ handle, link, starterPack }: Props) {
	const imageUrl = getStarterPackOgCard(starterPack);

	const onShareLink = () => {
		void shareUrl(link);
		handle.close();
	};

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['components.starterPack.share.invitePrompt']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastMedium">{m['components.starterPack.share.message']()}</Text>
			</Stack>

			<EmbedThumb frameClassName={styles.card} src={imageUrl} />

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
		</Stack>
	);
}
