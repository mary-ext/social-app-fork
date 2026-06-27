import { useCallback, useEffect, useMemo } from 'react';
import { Keyboard } from 'react-native';

import { useCallOnce } from '#/lib/once';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { PageX_Stroke2_Corner0_Rounded_Large as PageXIcon } from '#/components/icons/PageX';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { DraftItem } from './DraftItem';
import * as styles from './DraftsListDialog.css';
import { useDeleteDraftMutation, useDraftsQuery } from './state/queries';
import type { DraftSummary } from './state/schema';

type DraftsListDialogProps = {
	handle: Dialog.DialogHandle;
	onSelectDraft: (draft: DraftSummary) => void;
};

export function DraftsListDialog({ handle, onSelectDraft }: DraftsListDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup scroll="body" label={m['view.composer.title.drafts']()}>
				<DialogInner handle={handle} onSelectDraft={onSelectDraft} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, onSelectDraft }: DraftsListDialogProps) {
	const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useDraftsQuery();
	const { mutate: deleteDraft } = useDeleteDraftMutation();

	const drafts = useMemo(() => data?.pages.flatMap((page) => page.drafts) ?? [], [data]);

	// Fire draft:listOpen metric when dialog opens and data is loaded
	const draftCount = drafts.length;
	const isDataReady = !isLoading && data !== undefined;
	const onDraftListOpen = useCallOnce();
	useEffect(() => {
		if (isDataReady) {
			onDraftListOpen(() => {});
		}
	}, [onDraftListOpen, isDataReady, draftCount]);

	const handleSelectDraft = useCallback(
		(summary: DraftSummary) => {
			// Dismiss keyboard immediately to prevent flicker. Without this,
			// the text input regains focus (showing the keyboard) after the
			// drafts sheet closes, then loses it again when the post component
			// remounts with the draft content, causing a show-hide-show cycle -sfn
			Keyboard.dismiss();
			handle.close();
			onSelectDraft(summary);
		},
		[handle, onSelectDraft],
	);

	const handleDeleteDraft = useCallback(
		(draftSummary: DraftSummary) => {
			// Fire draft:delete metric
			deleteDraft({ draftId: draftSummary.id, draft: draftSummary.draft });
		},
		[deleteDraft],
	);

	const onEndReached = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot>
					<Button
						label={m['common.action.back']()}
						onClick={() => handle.close()}
						size="small"
						color="primary"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.back']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{m['view.composer.title.drafts']()}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot />
			</Dialog.Header.Outer>
			<Dialog.List
				className={styles.list}
				data={drafts}
				keyExtractor={(draft) => draft.id}
				renderItem={(draft) => (
					<div className={styles.itemWrap}>
						<DraftItem draft={draft} onSelect={handleSelectDraft} onDelete={handleDeleteDraft} />
					</div>
				)}
				onEndReached={onEndReached}
				isFetchingNextPage={isFetchingNextPage}
				loadingLabel={m['view.composer.status.loadingDrafts']()}
				ListEmptyComponent={
					isLoading ? (
						<div className={styles.loading}>
							<CenteredSpinner label={m['view.composer.status.loadingDrafts']()} size="lg" />
						</div>
					) : (
						<div className={styles.empty}>
							<PageXIcon width={48} height={48} fill={colors.textContrastLow} />
							<Text size="md" weight="medium" color="textContrastHigh" align="center">
								{m['view.composer.empty.drafts']()}
							</Text>
						</div>
					)
				}
				ListFooterComponent={
					drafts.length > 5 ? (
						<div className={styles.footerNote}>
							<Text align="center" color="textContrastMedium">
								{m['view.composer.empty.manyThoughts']()}
							</Text>
						</div>
					) : null
				}
			/>
		</>
	);
}
