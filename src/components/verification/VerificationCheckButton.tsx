import type { AnyProfileView } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import type { Shadow } from '#/state/cache/types';

import { type FullVerificationState, useFullVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import * as css from '#/components/verification/VerificationCheckButton.css';
import { VerificationsDialog } from '#/components/verification/VerificationsDialog';
import { VerifierDialog } from '#/components/verification/VerifierDialog';
import * as Dialog from '#/components/web/Dialog';

import { colors } from '#/styles/colors';

export function shouldShowVerificationCheckButton(state: FullVerificationState) {
	let ok = false;

	if (state.profile.role === 'default') {
		if (state.profile.isVerified) {
			ok = true;
		} else if (state.profile.isViewer && state.profile.wasVerified) {
			ok = true;
		} else if (state.viewer.role === 'verifier' && state.viewer.hasIssuedVerification) {
			ok = true;
		}
	} else if (state.profile.role === 'verifier') {
		if (state.profile.isViewer) {
			ok = true;
		} else if (state.profile.isVerified) {
			ok = true;
		}
	}

	if (
		!state.profile.showBadge &&
		!state.profile.isViewer &&
		!(state.viewer.role === 'verifier' && state.viewer.hasIssuedVerification)
	) {
		ok = false;
	}

	return ok;
}

export function VerificationCheckButton({
	profile,
	width,
}: {
	profile: Shadow<AnyProfileView>;
	width: number;
}) {
	const state = useFullVerificationState({
		profile,
	});

	if (shouldShowVerificationCheckButton(state)) {
		return <Badge profile={profile} verificationState={state} width={width} />;
	}

	return null;
}

function Badge({
	profile,
	verificationState: state,
	width,
}: {
	profile: Shadow<AnyProfileView>;
	verificationState: FullVerificationState;
	width: number;
}) {
	const { t: l } = useLingui();
	const verificationsControl = Dialog.useDialogHandle();
	const verifierControl = Dialog.useDialogHandle();

	const isVerifier = state.profile.role === 'verifier';
	const verifiedByHidden = !state.profile.showBadge && state.profile.isViewer;
	const fill = verifiedByHidden
		? colors.contrast_100
		: state.profile.isVerified
			? colors.primary_500
			: colors.contrast_100;
	const control = isVerifier ? verifierControl : verificationsControl;

	return (
		<>
			<Dialog.Trigger
				aria-label={state.profile.isViewer ? l`View your verifications` : l`View this user's verifications`}
				className={css.button}
				handle={control}
				onClick={(e) => e.stopPropagation()}
			>
				<span className={css.icon} style={{ color: fill }}>
					<VerificationCheck fill="currentColor" verifier={isVerifier} width={width} />
				</span>
			</Dialog.Trigger>
			<VerificationsDialog handle={verificationsControl} profile={profile} verificationState={state} />
			<VerifierDialog handle={verifierControl} profile={profile} verificationState={state} />
		</>
	);
}
