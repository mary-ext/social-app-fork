import type { AnyProfileView } from '@atcute/bluesky';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

import { Logo } from '#/view/icons/Logo';

import { VerifiedCheck } from '#/components/icons/VerifiedCheck';
import { VerifierCheck } from '#/components/icons/VerifierCheck';
import { Text } from '#/components/Text';
import * as css from '#/components/verification/VerifierDialog.css';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

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

const VerificationIllustration = () => {
	return (
		<div
			aria-label={m['components.verification.trustedVerifier.illustration']()}
			className={css.imageBox}
			role="img"
		>
			<div className={css.illustrationInner}>
				{/* Step 1: Bluesky logo */}
				<div className={css.blueskyCircleClass}>
					<Logo fill="#ffffff" width={32} />
				</div>
				<span className={css.blueskyLabelClass}>{m['components.verification.illustration.bluesky']()}</span>

				{/* Arrow 1 */}
				<div className={css.arrow1}>
					<svg fill="none" height={16} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16}>
						<path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>

				{/* Step 2: Trusted Verifier badge */}
				<div className={css.verifierCircleClass}>
					<VerifierCheck height={56} width={56} />
				</div>
				<span className={css.verifierLabelClass}>
					{m['components.verification.illustration.trustedVerifier']()}
				</span>

				{/* Arrow 2 */}
				<div className={css.arrow2}>
					<svg fill="none" height={16} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16}>
						<path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>

				{/* Step 3: Verified Account badge */}
				<div className={css.verifiedCircleClass}>
					<VerifiedCheck height={56} width={56} />
				</div>
				<span className={css.verifiedLabelClass}>
					{m['components.verification.illustration.verifiedAccount']()}
				</span>
			</div>
		</div>
	);
};

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const name = getUserDisplayName(profile);
	const label = isSelf
		? m['components.verification.trustedVerifier.youStatus']()
		: m['components.verification.trustedVerifier.userStatus']({ name });

	return (
		<div className={css.content}>
			<VerificationIllustration />

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
