import type { AnyProfileView } from '@atcute/bluesky';

import { isAbortError } from '#/lib/errors';

import type { Shadow } from '#/state/cache/types';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';

import { useRequireAuth } from '#/components/hooks/use-require-auth';
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
				if (!isAbortError(e)) {
					console.error('useFollowMethods: failed to follow', e);
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
				if (!isAbortError(e)) {
					console.error('useFollowMethods: failed to unfollow', e);
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
