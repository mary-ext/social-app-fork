import type { AppBskyActorDefs, AppBskyActorProfile } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { findRecord, uploadBlob } from '#/lib/api/records';

import { profileQueryKey } from '#/state/queries/profile-key';
import { whenProfileViewReady } from '#/state/queries/when-profile-view-ready';
import { getClients } from '#/state/session';

import { prepareLinkWrites } from '#/features/profile-links/link-writes';
import { useUpdateProfileVerificationCache } from '#/features/verification/use-update-verification-cache';

import { editsCommitted } from './edits-committed';
import type { ProfileEdits, ProfileImageEdit } from './profile-edits';

type ProfileRecordWrite = {
	-readonly [K in keyof Omit<AppBskyActorProfile.Main, '$type'>]: Omit<AppBskyActorProfile.Main, '$type'>[K];
};

const uploadImageEdit = async (pds: Client, edit: ProfileImageEdit): Promise<AtpBlob | undefined> => {
	switch (edit.kind) {
		case 'remove': {
			return undefined;
		}
		case 'replace': {
			return uploadBlob(pds, edit.image.blob, edit.image.blob.type);
		}
	}
};

/**
 * saves profile and link edits atomically, then polls the AppView until they appear or polling expires.
 *
 * @returns the mutation, taking the profile being edited and the edits to apply
 */
export function useProfileUpdateMutation() {
	const queryClient = useQueryClient();
	const { appview, pds } = getClients();
	const updateProfileVerificationCache = useUpdateProfileVerificationCache();
	return useMutation<void, Error, { edits: ProfileEdits; profile: AppBskyActorDefs.ProfileViewDetailed }>({
		mutationFn: async ({ edits, profile }) => {
			if (!pds) {
				throw new Error(`not signed in`);
			}

			const [existing, avatar, banner, links] = await Promise.all([
				findRecord(pds, { repo: profile.did, collection: 'app.bsky.actor.profile', rkey: 'self' }),
				edits.avatar && uploadImageEdit(pds, edits.avatar),
				edits.banner && uploadImageEdit(pds, edits.banner),
				edits.links && prepareLinkWrites(pds, profile.did, edits.links),
			]);

			const next: ProfileRecordWrite = { ...existing?.value };
			if (edits.avatar) {
				next.avatar = avatar;
			}
			if (edits.banner) {
				next.banner = banner;
			}
			if (edits.description !== undefined) {
				next.description = edits.description || undefined;
			}
			if (edits.displayName !== undefined) {
				next.displayName = edits.displayName || undefined;
			}
			if (links) {
				next.links = links.refs.length > 0 ? links.refs : undefined;
			}

			await ok(
				pds.post('com.atproto.repo.applyWrites', {
					input: {
						repo: profile.did,
						writes: [
							...(links?.writes ?? []),
							{
								$type: existing
									? 'com.atproto.repo.applyWrites#update'
									: 'com.atproto.repo.applyWrites#create',
								collection: 'app.bsky.actor.profile',
								rkey: 'self',
								value: { $type: 'app.bsky.actor.profile', ...next } satisfies AppBskyActorProfile.Main,
							},
						],
					},
				}),
			);

			await whenProfileViewReady(appview, profile.did, (fresh) => {
				return editsCommitted({ edits, fresh, linkRefs: links?.refs, profile });
			});
		},
		async onSuccess(_, variables) {
			// invalidate cache
			void queryClient.invalidateQueries({
				queryKey: profileQueryKey(variables.profile.did),
			});
			await updateProfileVerificationCache({ profile: variables.profile });
		},
	});
}
