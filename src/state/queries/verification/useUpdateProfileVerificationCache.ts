import { useCallback } from 'react';
import { ok } from '@atcute/client';
import { type ActorIdentifier } from '@atcute/lexicons';
import { useQueryClient } from '@tanstack/react-query';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import type * as bsky from '#/types/bsky';

/**
 * Fetches a fresh verification state from the app view and updates our profile cache. This state is computed
 * using a variety of factors on the server, so we need to get this data from the server.
 */
export function useUpdateProfileVerificationCache() {
	const qc = useQueryClient();
	const { appview } = useClients();

	return useCallback(
		async ({ profile }: { profile: bsky.profile.AnyProfileView }) => {
			try {
				const updated = await ok(
					appview.get('app.bsky.actor.getProfile', {
						params: { actor: (profile.did ?? '') as ActorIdentifier },
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
