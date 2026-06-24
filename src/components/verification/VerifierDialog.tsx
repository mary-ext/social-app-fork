import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useSession } from '#/state/session';

import { VerifierCheck } from '#/components/icons/VerifierCheck';
import { Text } from '#/components/Text';
import * as css from '#/components/verification/VerifierDialog.css';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLinkButton } from '#/components/web/Link';

import announcementImage from '../../../assets/images/initial_verification_announcement_1.png';

export function VerifierDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	const { t: l } = useLingui();
	const userName = getUserDisplayName(profile);
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={l`Trusted verifier information for ${userName}`} size="narrow">
				<DialogInner handle={handle} profile={profile} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const userName = getUserDisplayName(profile);
	const label = isSelf ? l`You are a trusted verifier` : l`${userName} is a trusted verifier`;

	return (
		<div className={css.content}>
			<div className={css.imageBox}>
				<img
					alt={l`An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts.`}
					className={css.image}
					src={announcementImage}
				/>
			</div>

			<div className={css.textBlock}>
				<Text className={css.title} size="_2xl" weight="semiBold">
					{label}
				</Text>
				<Text size="md">
					<Trans>
						Accounts with a scalloped blue check mark <VerifierCheck className={css.inlineCheck} width={14} />{' '}
						can verify others. These trusted verifiers are selected by Bluesky.
					</Trans>
				</Text>
			</div>

			<div className={css.actions}>
				<ExternalLinkButton
					color="primary"
					label={l({
						context: `english-only-resource`,
						message: `Learn more about verification on Bluesky`,
					})}
					size="small"
					href={urls.website.blog.initialVerificationAnnouncement}
				>
					<ButtonText>
						<Trans context="english-only-resource">Learn more</Trans>
					</ButtonText>
				</ExternalLinkButton>
				<Button color="secondary" label={l`Close dialog`} onClick={() => handle.close()} size="small">
					<ButtonText>
						<Trans>Close</Trans>
					</ButtonText>
				</Button>
			</div>
		</div>
	);
}
