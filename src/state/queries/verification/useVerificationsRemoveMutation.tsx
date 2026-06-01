import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useMutation } from '@tanstack/react-query';

import { deleteRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';

import { useUpdateProfileVerificationCache } from '#/state/queries/verification/useUpdateProfileVerificationCache';
import { useClients, useSession } from '#/state/session';

export function useVerificationsRemoveMutation() {
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();
	const updateProfileVerificationCache = useUpdateProfileVerificationCache();

	return useMutation({
		async mutationFn({
			profile,
			verifications,
		}: {
			profile: AnyProfileView;
			verifications: AppBskyActorDefs.VerificationView[];
		}) {
			if (!currentAccount) {
				throw new Error('User not logged in');
			}

			const uris = verifications.map((v) => v.uri);

			await Promise.all(
				uris.map((uri) => {
					return deleteRecord(pds!, {
						collection: 'app.bsky.graph.verification',
						repo: currentAccount.did as Did,
						rkey: parseCanonicalResourceUri(uri).rkey,
					});
				}),
			);

			await until(
				5,
				1e3,
				(prof) => {
					if (!prof?.verification?.verifications.some((v) => uris.includes(v.uri))) {
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
