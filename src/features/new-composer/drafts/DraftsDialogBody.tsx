import { useState } from 'react';

import type { AppBskyDraftDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { BlankState } from '#/components/BlankState';
import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import { ErrorState } from '#/components/ErrorState';
import * as ListTail from '#/components/List/ListTail';
import * as Toast from '#/components/Toast';

import PageIcon from '#/icons/central/PageText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { DraftRow } from './DraftRow';
import { useDeleteDraftMutation, useDraftsQuery, useStoredDraftMediaQuery } from './queries';

const NO_STORED_MEDIA: ReadonlySet<string> = new Set();

/**
 * saved drafts with restore and delete actions.
 *
 * @param props dialog handle and draft selection callback
 * @returns the draft list
 */
export function DraftsDialogBody({
	handle,
	onSelect,
}: {
	handle: Dialog.DialogHandle;
	onSelect: (view: AppBskyDraftDefs.DraftView) => Promise<void>;
}) {
	const {
		data,
		error,
		isPending,
		isError,
		isFetchNextPageError,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
		refetch,
	} = useDraftsQuery();
	const { data: storedMedia = NO_STORED_MEDIA, isPending: isMediaPending } = useStoredDraftMediaQuery();
	const { mutate: deleteDraft } = useDeleteDraftMutation();
	const [restoringId, setRestoringId] = useState<string | null>(null);

	// wait for local paths to avoid false missing-media notices.
	const drafts = isMediaPending ? [] : (data?.pages.flatMap((page) => page.drafts) ?? []);

	const select = async (view: AppBskyDraftDefs.DraftView) => {
		setRestoringId(view.id);
		try {
			await onSelect(view);
			handle.close();
		} catch (err) {
			console.error('failed to open draft', err);
			Toast.show(`Couldn't open this draft`, { type: 'error' });
		} finally {
			setRestoringId(null);
		}
	};

	const header = (
		<Dialog.Header.Root border>
			<Dialog.Header.Close />
			<Dialog.Header.Title>{m['view.composer.drafts.title']()}</Dialog.Header.Title>
		</Dialog.Header.Root>
	);

	if (drafts.length < 1) {
		let state;
		if (isPending || isMediaPending) {
			state = <CenteredSpinner label={m['view.composer.drafts.loading']()} size="xl" fill />;
		} else if (isError) {
			state = <ErrorState message={`Couldn't load your drafts`} onRetry={() => void refetch()} />;
		} else {
			state = <BlankState icon={PageIcon} message={m['view.composer.drafts.empty']()} />;
		}

		return (
			<>
				{header}
				<Dialog.Body>{state}</Dialog.Body>
			</>
		);
	}

	return (
		<>
			{header}

			<Dialog.List
				data={drafts}
				keyExtractor={(view) => view.id}
				estimateHeight={120}
				renderItem={({ item: view, index }) => (
					<DraftRow
						view={view}
						storedMedia={storedMedia}
						hideTopBorder={index === 0}
						isRestoring={restoringId === view.id}
						disabled={restoringId !== null}
						onSelect={() => void select(view)}
						onDelete={() => {
							deleteDraft(view, {
								onError(err) {
									console.error('failed to delete draft', err);
									Toast.show(`Couldn't delete this draft`, { type: 'error' });
								},
							});
						}}
					/>
				)}
				onEndReached={() => {
					if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
						void fetchNextPage();
					}
				}}
				ListFooterComponent={
					<ListTail.Frame>
						{isFetchingNextPage ? (
							<ListTail.Pending />
						) : isFetchNextPageError ? (
							<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
						) : null}
					</ListTail.Frame>
				}
			/>
		</>
	);
}
