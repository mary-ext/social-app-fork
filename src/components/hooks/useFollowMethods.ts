import { useCallback } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import type { Shadow } from '#/state/cache/types';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useRequireAuth } from '#/state/session';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

export function useFollowMethods({ profile }: { profile: Shadow<AnyProfileView> }) {
	const { t: l } = useLingui();
	const requireAuth = useRequireAuth();
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);

	const follow = useCallback(() => {
		requireAuth(async () => {
			try {
				await queueFollow();
			} catch (e) {
				logger.error(`useFollowMethods: failed to follow`, { message: String(e) });
				if (!(e instanceof Error && e.name === 'AbortError')) {
					Toast.show(l`An issue occurred, please try again.`, {
						type: 'error',
					});
				}
			}
		});
	}, [l, queueFollow, requireAuth]);

	const unfollow = useCallback(() => {
		requireAuth(async () => {
			try {
				await queueUnfollow();
			} catch (e) {
				logger.error(`useFollowMethods: failed to unfollow`, {
					message: String(e),
				});
				if (!(e instanceof Error && e.name === 'AbortError')) {
					Toast.show(l`An issue occurred, please try again.`, {
						type: 'error',
					});
				}
			}
		});
	}, [l, queueUnfollow, requireAuth]);

	return {
		follow,
		unfollow,
	};
}
