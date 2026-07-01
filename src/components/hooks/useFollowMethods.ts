import type { AnyProfileView } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useRequireAuth } from '#/state/session';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function useFollowMethods({ profile }: { profile: Shadow<AnyProfileView> }) {
	const requireAuth = useRequireAuth();
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);

	const follow = () => {
		requireAuth(async () => {
			try {
				await queueFollow();
			} catch (e) {
				logger.error(`useFollowMethods: failed to follow`, { message: String(e) });
				if (!(e instanceof Error && e.name === 'AbortError')) {
					Toast.show(m['common.error.generic'](), {
						type: 'error',
					});
				}
			}
		});
	};

	const unfollow = () => {
		requireAuth(async () => {
			try {
				await queueUnfollow();
			} catch (e) {
				logger.error(`useFollowMethods: failed to unfollow`, {
					message: String(e),
				});
				if (!(e instanceof Error && e.name === 'AbortError')) {
					Toast.show(m['common.error.generic'](), {
						type: 'error',
					});
				}
			}
		});
	};

	return {
		follow,
		unfollow,
	};
}
