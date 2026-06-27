import type { AnyProfileView } from '@atcute/bluesky';
import { Trans } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useSession } from '#/state/session';

import { VerifierCheck } from '#/components/icons/VerifierCheck';
import { Text } from '#/components/Text';
import * as css from '#/components/verification/VerifierDialog.css';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import announcementImage from '../../../assets/images/initial_verification_announcement_1.png';

export function VerifierDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	const userName = getUserDisplayName(profile);
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup
				label={m['components.verification.label.trustedVerifierInfo']({ userName })}
				size="narrow"
			>
				<DialogInner handle={handle} profile={profile} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const userName = getUserDisplayName(profile);
	const label = isSelf
		? m['components.verification.status.youTrustedVerifier']()
		: m['components.verification.status.userTrustedVerifier']({ userName });

	return (
		<div className={css.content}>
			<div className={css.imageBox}>
				<img
					alt={m['components.verification.a11y.illustration']()}
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
					label={m['components.verification.cta.learnMore']()}
					size="small"
					href={urls.website.blog.initialVerificationAnnouncement}
				>
					<ButtonText>{m['common.action.learnMore']()}</ButtonText>
				</ExternalLinkButton>
				<Button
					color="secondary"
					label={m['common.a11y.closeDialog']()}
					onClick={() => handle.close()}
					size="small"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}
