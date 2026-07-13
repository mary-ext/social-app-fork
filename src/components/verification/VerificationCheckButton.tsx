import type { AnyProfileView } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';
import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import * as css from '#/components/verification/VerificationCheckButton.css';
import { VerificationsDialog } from '#/components/verification/VerificationsDialog';
import { VerifierDialog } from '#/components/verification/VerifierDialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type FullVerificationState = {
	profile: {
		role: 'default' | 'verifier';
		isVerified: boolean;
		wasVerified: boolean;
		isViewer: boolean;
		showBadge: boolean;
	};
	viewer:
		| {
				role: 'default';
				isVerified: boolean;
		  }
		| {
				role: 'verifier';
				isVerified: boolean;
				hasIssuedVerification: boolean;
		  };
};

// Fuses the viewed profile's verification state with the viewer's own (am I a verifier, did I verify
// this account) — the badge's visibility decision needs both perspectives at once.
function useFullVerificationState({ profile }: { profile: AnyProfileView }): FullVerificationState {
	const { currentAccount } = useSession();
	const currentAccountProfile = useCurrentAccountProfile();
	const profileState = useSimpleVerificationState({ profile });
	const viewerState = useSimpleVerificationState({
		profile: currentAccountProfile,
	});

	const verifications = profile.verification?.verifications || [];
	const wasVerified = profileState.role === 'default' && !profileState.isVerified && verifications.length > 0;
	const hasIssuedVerification = Boolean(
		viewerState &&
		viewerState.role === 'verifier' &&
		profileState.role === 'default' &&
		verifications.find((v) => v.issuer === currentAccount?.did),
	);

	return {
		profile: {
			...profileState,
			wasVerified,
			isViewer: profile.did === currentAccount?.did,
			showBadge: profileState.showBadge,
		},
		viewer:
			viewerState.role === 'verifier'
				? {
						role: 'verifier',
						isVerified: viewerState.isVerified,
						hasIssuedVerification,
					}
				: {
						role: 'default',
						isVerified: viewerState.isVerified,
					},
	};
}

function shouldShowVerificationCheckButton(state: FullVerificationState) {
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
	const verificationsHandle = Dialog.useDialogHandle();
	const verifierHandle = Dialog.useDialogHandle();

	const isVerifier = state.profile.role === 'verifier';
	const verifiedByHidden = !state.profile.showBadge && state.profile.isViewer;
	const fill = verifiedByHidden
		? colors.contrast_100
		: state.profile.isVerified
			? colors.primary_500
			: colors.contrast_100;
	const handle = isVerifier ? verifierHandle : verificationsHandle;

	return (
		<>
			<Dialog.Trigger
				aria-label={
					state.profile.isViewer
						? m['components.verification.verifications.action.viewYours']()
						: m['components.verification.verifications.action.viewUser']()
				}
				className={css.button}
				handle={handle}
				onClick={(e) => e.stopPropagation()}
			>
				<VerificationCheck fill={fill} verifier={isVerifier} width={width} />
			</Dialog.Trigger>
			<VerificationsDialog handle={verificationsHandle} profile={profile} />
			<VerifierDialog handle={verifierHandle} profile={profile} />
		</>
	);
}
