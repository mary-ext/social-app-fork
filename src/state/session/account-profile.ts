import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';

import type { AuthAccount, AuthAccountProfile } from '#/storage';

/**
 * creates the stored profile snapshot for an account.
 *
 * @param profile the profile view to project
 * @returns a complete replacement snapshot
 */
export function toAccountProfile(profile: AnyProfileView): AuthAccountProfile {
	const snapshot: AuthAccountProfile = {};

	if (profile.associated?.labeler === true) {
		snapshot.associated = { labeler: profile.associated.labeler };
	}
	if (profile.avatar !== undefined) {
		snapshot.avatar = profile.avatar;
	}
	if (profile.displayName !== undefined) {
		snapshot.displayName = profile.displayName;
	}
	if (profile.verification !== undefined) {
		snapshot.verification = {
			trustedVerifierStatus: profile.verification.trustedVerifierStatus,
			verifiedStatus: profile.verification.verifiedStatus,
		};
	}

	return snapshot;
}

// stable placeholder identity avoids renders; accounts are replaced when data changes.
const views = new WeakMap<AuthAccount, AppBskyActorDefs.ProfileViewBasic>();

/**
 * creates placeholder profile data from a stored account.
 *
 * @param account the stored account
 * @returns a cached basic profile view
 */
export function accountProfileView(account: AuthAccount): AppBskyActorDefs.ProfileViewBasic {
	const cached = views.get(account);
	if (cached) {
		return cached;
	}

	const { verification, ...rest } = account.profile ?? {};
	const view: AppBskyActorDefs.ProfileViewBasic = {
		...rest,
		did: account.did,
		handle: account.handle,
		// verifier-derived flags remain false until the full profile resolves.
		verification: verification && { ...verification, verifications: [] },
	};
	views.set(account, view);
	return view;
}
