import type { AnyProfileView } from '@atcute/bluesky';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

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
	const name = getUserDisplayName(profile);
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['components.verification.trustedVerifier.title']({ name })} size="narrow">
				<DialogInner handle={handle} profile={profile} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const name = getUserDisplayName(profile);
	const label = isSelf
		? m['components.verification.trustedVerifier.youStatus']()
		: m['components.verification.trustedVerifier.userStatus']({ name });

	return (
		<div className={css.content}>
			<div className={css.imageBox}>
				<img
					alt={m['components.verification.trustedVerifier.illustration']()}
					className={css.image}
					src={announcementImage}
				/>
			</div>

			<div className={css.textBlock}>
				<Text className={css.title} size="_2xl" weight="semiBold">
					{label}
				</Text>
				<Text size="md">
					<Trans
						message={m['components.verification.trustedVerifier.description']}
						markup={{ t0: () => <VerifierCheck className={css.inlineCheck} width={14} /> }}
					/>
				</Text>
			</div>

			<div className={css.actions}>
				<ExternalLinkButton
					color="primary"
					label={m['components.verification.learnMore']()}
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
