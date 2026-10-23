import { lazy, Suspense } from 'react';

import type { ResourceUri } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { useGetPost } from '#/state/queries/post/post';
import { postgateQueryOptions } from '#/state/queries/postgate/postgate';
import { threadgateViewQueryOptions } from '#/state/queries/threadgate/view';
import { getClients } from '#/state/session';

import * as Dialog from '#/components/Dialog';

import type { PostInteractionSettingsDialogProps } from './SettingsBody';
import { SettingsLoading } from './SettingsLoading';

const importSettingsBody = () => import('./SettingsBody').then((mod) => ({ default: mod.SettingsBody }));

const SettingsBody = lazy(importSettingsBody);

export type { PostInteractionSettingsDialogProps };

/**
 * edits reply and quote settings for a published post.
 *
 * @param props dialog handle and post identifiers
 * @returns the dialog
 */
export function PostInteractionSettingsDialog({ handle, ...props }: PostInteractionSettingsDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup height="fixed" scroll="body" size="medium">
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
				queryClient.prefetchQuery(postgateQueryOptions({ appview, pds: pds!, postUri })),
				queryClient.prefetchQuery(threadgateViewQueryOptions({ getPost, postUri: rootPostUri })),
			]);
		} catch (e) {
			console.error('Failed to prefetch post interaction settings', e);
		}
	};
}
