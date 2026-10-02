import { useState } from 'react';

import type { AppBskyDraftDefs } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import PageIcon from '#/icons/central/PageText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { DraftRow } from './DraftRow';
import * as css from './DraftsDialog.css';
import { useDeleteDraftMutation, useDraftsQuery, useStoredDraftMediaQuery } from './queries';

const NO_STORED_MEDIA: ReadonlySet<string> = new Set();

/**
 * lists the account's saved drafts.
 *
 * @param props.handle opens the dialog
 * @param props.onSelect opens a draft in the composer; the dialog closes once it resolves
 * @returns the dialog
 */
export function DraftsDialog({
	handle,
	onSelect,
}: {
	handle: Dialog.DialogHandle;
	onSelect: (view: AppBskyDraftDefs.DraftView) => Promise<void>;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['view.composer.drafts.title']()} scroll="body">
				<DraftsList handle={handle} onSelect={onSelect} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DraftsList({
	handle,
	onSelect,
}: {
	handle: Dialog.DialogHandle;
	onSelect: (view: AppBskyDraftDefs.DraftView) => Promise<void>;
}) {
	const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useDraftsQuery();
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

	let placeholder;
	if (isPending || isMediaPending) {
		placeholder = <Spinner color="default" label={m['view.composer.drafts.loading']()} />;
	} else if (isError) {
		placeholder = (
			<Text size="md" color="textContrastMedium" align="center">
				{`Couldn't load your drafts`}
			</Text>
		);
	} else {
		placeholder = (
			<>
				<PageIcon className={css.placeholderIcon} />
				<Text size="md" weight="medium" color="textContrastHigh" align="center">
					{m['view.composer.drafts.empty']()}
				</Text>
			</>
		);
	}

	return (
		<>
			<Dialog.Header.Root border>
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['view.composer.drafts.title']()}</Dialog.Header.Title>
			</Dialog.Header.Root>

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
					if (hasNextPage && !isFetchingNextPage) {
						void fetchNextPage();
					}
				}}
				ListEmptyComponent={<div className={css.placeholder}>{placeholder}</div>}
				ListFooterComponent={
					isFetchingNextPage && (
						<div className={css.placeholder}>
							<Spinner color="default" label={m['view.composer.drafts.loading']()} />
						</div>
					)
				}
			/>
		</>
	);
}
