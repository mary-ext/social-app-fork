import type { AnyProfileView } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import { useMutation } from '@tanstack/react-query';

import { createRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';

import { useUpdateProfileVerificationCache } from '#/state/queries/verification/useUpdateProfileVerificationCache';
import { useClients, useSession } from '#/state/session';

export function useVerificationCreateMutation() {
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();
	const updateProfileVerificationCache = useUpdateProfileVerificationCache();

	return useMutation({
		async mutationFn({ profile }: { profile: AnyProfileView }) {
			if (!currentAccount) {
				throw new Error('User not logged in');
			}

			const { uri } = await createRecord(pds!, {
				collection: 'app.bsky.graph.verification',
				record: {
					$type: 'app.bsky.graph.verification',
					createdAt: new Date().toISOString(),
					displayName: profile.displayName || '',
					handle: profile.handle as Handle,
					subject: profile.did as Did,
				},
				repo: currentAccount.did as Did,
			});

			await until(
				5,
				1e3,
				(prof) => {
					if (prof?.verification && prof.verification.verifications.find((v) => v.uri === uri)) {
						return true;
					}
					return false;
				},
				() =>
					ok(
						appview.get('app.bsky.actor.getProfile', {
							params: { actor: (profile.did ?? '') as ActorIdentifier },
						}),
					),
			);
		},
		async onSuccess(_, { profile }) {
			await updateProfileVerificationCache({ profile });
		},
	});
}
