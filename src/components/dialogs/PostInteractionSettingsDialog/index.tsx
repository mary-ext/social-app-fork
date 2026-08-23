import { lazy, Suspense } from 'react';

import type { ResourceUri } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useGetPost } from '#/state/queries/post';
import { createPostgateQueryKey, getPostgateRecord } from '#/state/queries/postgate';
import { createThreadgateViewQueryKey } from '#/state/queries/threadgate';
import { getClients } from '#/state/session';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import type { PostInteractionSettingsDialogProps } from './SettingsBody';
import { SettingsLoading } from './SettingsLoading';

const importSettingsBody = () => import('./SettingsBody').then((mod) => ({ default: mod.SettingsBody }));

const SettingsBody = lazy(importSettingsBody);

export type { PostInteractionSettingsDialogProps };

/** Threadgate settings dialog. Used in the thread. */
export function PostInteractionSettingsDialog({ handle, ...props }: PostInteractionSettingsDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['components.dialogs.interaction.title']()} size="narrow">
				<Suspense fallback={<SettingsLoading />}>
					<SettingsBody handle={handle} {...props} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export function usePrefetchPostInteractionSettings({
	postUri,
	rootPostUri,
}: {
	postUri: ResourceUri;
	rootPostUri: ResourceUri;
}) {
	const queryClient = useQueryClient();
	const { appview, pds } = getClients();
	const getPost = useGetPost();

	return async () => {
		try {
			await Promise.all([
				importSettingsBody(),
				queryClient.prefetchQuery({
					queryKey: createPostgateQueryKey(postUri),
					queryFn: ({ signal }) =>
						getPostgateRecord({ appview, pds: pds!, postUri, signal }).then((res) => res ?? null),
					staleTime: STALE.SECONDS.THIRTY,
				}),
				queryClient.prefetchQuery({
					queryKey: createThreadgateViewQueryKey(rootPostUri),
					queryFn: async () => {
						const post = await getPost({ uri: rootPostUri });
						return post.threadgate ?? null;
					},
					staleTime: STALE.SECONDS.THIRTY,
				}),
			]);
		} catch (e) {
			console.error('Failed to prefetch post interaction settings', e);
		}
	};
}
