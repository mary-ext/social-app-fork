import type { AnyProfileView } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useQueryClient } from '@tanstack/react-query';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { getClients } from '#/state/session';

/** fetches a fresh verification state from the app view and updates the profile cache. */
export function useUpdateProfileVerificationCache() {
	const qc = useQueryClient();
	const { appview } = getClients();

	return async ({ profile }: { profile: AnyProfileView }) => {
		try {
			const updated = await ok(
				appview.get('app.bsky.actor.getProfile', {
					params: { actor: profile.did ?? '' },
				}),
			);
			updateProfileShadow(qc, profile.did, {
				verification: updated.verification,
			});
		} catch (e) {
			console.error('useUpdateProfileVerificationCache failed', e);
		}
	};
}
