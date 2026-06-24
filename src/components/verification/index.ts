import { useMemo } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';

import { usePreferencesQuery } from '#/state/queries/preferences';

export type SimpleVerificationState = {
	role: 'default' | 'verifier';
	isVerified: boolean;
	showBadge: boolean;
};

export function useSimpleVerificationState({
	profile,
}: {
	profile?: AnyProfileView;
}): SimpleVerificationState {
	const preferences = usePreferencesQuery();
	const prefs = useMemo(
		() => preferences.data?.verificationPrefs || { hideBadges: false },
		[preferences.data?.verificationPrefs],
	);
	return useMemo(() => {
		if (!profile || !profile.verification) {
			return {
				role: 'default',
				isVerified: false,
				showBadge: false,
			};
		}

		const { verifiedStatus, trustedVerifierStatus } = profile.verification;
		const isVerifiedUser = ['valid', 'invalid'].includes(verifiedStatus);
		const isVerifierUser = ['valid', 'invalid'].includes(trustedVerifierStatus);
		const isVerified =
			(isVerifiedUser && verifiedStatus === 'valid') || (isVerifierUser && trustedVerifierStatus === 'valid');

		return {
			role: isVerifierUser ? 'verifier' : 'default',
			isVerified,
			showBadge: prefs.hideBadges ? false : isVerified,
		};
	}, [profile, prefs]);
}
