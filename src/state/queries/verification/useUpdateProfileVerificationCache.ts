import { useCallback } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useQueryClient } from '@tanstack/react-query';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

/** fetches a fresh verification state from the app view and updates the profile cache. */
export function useUpdateProfileVerificationCache() {
	const qc = useQueryClient();
	const { appview } = useClients();

	return useCallback(
		async ({ profile }: { profile: AnyProfileView }) => {
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
				logger.error(`useUpdateProfileVerificationCache failed`, {
					safeMessage: e,
				});
			}
		},
		[appview, qc],
	);
}
