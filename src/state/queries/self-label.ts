import type { AppBskyActorDefs, AppBskyActorProfile } from '@atcute/bluesky';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getClients, useSession } from '../session';
import { updateOwnProfileRecord } from './own-profile-record';
import { profileQueryKey } from './profile-key';
import { whenProfileViewReady } from './when-profile-view-ready';

/**
 * @param profile the profile view to check
 * @param value the self-label value
 * @returns whether the profile labels itself with `value`
 */
export const hasSelfLabel = (profile: AppBskyActorDefs.ProfileViewDetailed, value: string): boolean => {
	return !!profile.labels?.some((label) => label.val === value && label.src === profile.did);
};

/** @returns the record's labels with `value` set or cleared, or undefined when already in that state */
const withSelfLabel = (
	labels: AppBskyActorProfile.Main['labels'],
	{ enabled, value }: { enabled: boolean; value: string },
): { labels: AppBskyActorProfile.Main['labels'] } | undefined => {
	const current = labels?.$type === 'com.atproto.label.defs#selfLabels' ? labels.values : [];
	if (current.some((label) => label.val === value) === enabled) {
		return undefined;
	}

	const values = current.filter((label) => label.val !== value);
	if (enabled) {
		values.push({ val: value });
	}
	return {
		labels: values.length > 0 ? { $type: 'com.atproto.label.defs#selfLabels', values } : undefined,
	};
};

/**
 * adds or removes a self-label on the current account's profile, leaving other self-labels intact, then polls
 * the AppView until the change appears or polling expires.
 *
 * @returns the mutation, taking the self-label value and whether it should be set
 */
export function useSelfLabelMutation() {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();

	return useMutation<void, Error, { enabled: boolean; value: string }>({
		mutationFn: async (label) => {
			if (!currentAccount || !pds) {
				throw new Error(`not signed in`);
			}
			const did = currentAccount.did;

			await updateOwnProfileRecord(pds, did, (existing) => {
				const next = withSelfLabel(existing?.labels, label);
				return next && { ...existing, ...next };
			});

			await whenProfileViewReady(appview, did, (fresh) => hasSelfLabel(fresh, label.value) === label.enabled);
		},
		onSuccess() {
			if (currentAccount) {
				void queryClient.invalidateQueries({ queryKey: profileQueryKey(currentAccount.did) });
			}
		},
	});
}
