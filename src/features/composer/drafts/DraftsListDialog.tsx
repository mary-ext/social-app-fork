import { useEffect } from 'react';

import { useCallOnce } from '#/lib/once';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import { PageX_Stroke2_Corner0_Rounded_Large as PageXIcon } from '#/components/icons/PageX';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

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
			<Dialog.Popup scroll="body">
				<DialogInner handle={handle} onSelectDraft={onSelectDraft} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, onSelectDraft }: DraftsListDialogProps) {
	const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useDraftsQuery();
	const { mutate: deleteDraft } = useDeleteDraftMutation();

	const drafts = data?.pages.flatMap((page) => page.drafts) ?? [];

	// Fire draft:listOpen metric when dialog opens and data is loaded
	const draftCount = drafts.length;
	const isDataReady = !isLoading && data !== undefined;
	const onDraftListOpen = useCallOnce();
	useEffect(() => {
		if (isDataReady) {
			onDraftListOpen(() => {});
		}
	}, [onDraftListOpen, isDataReady, draftCount]);

	const handleSelectDraft = (summary: DraftSummary) => {
		handle.close();
		onSelectDraft(summary);
	};

	const handleDeleteDraft = (draftSummary: DraftSummary) => {
		// Fire draft:delete metric
		deleteDraft({ draftId: draftSummary.id, draft: draftSummary.draft });
	};

	const onEndReached = () => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	};

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
					<Dialog.Header.TitleText>{m['view.composer.drafts.title']()}</Dialog.Header.TitleText>
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
				loadingLabel={m['view.composer.drafts.loading']()}
				ListEmptyComponent={
					isLoading ? (
						<div className={styles.loading}>
							<CenteredSpinner label={m['view.composer.drafts.loading']()} size="xl" />
						</div>
					) : (
						<div className={styles.empty}>
							<PageXIcon size="4xl" fill={colors.textContrastLow} />
							<Text size="md" weight="medium" color="textContrastHigh" align="center">
								{m['view.composer.drafts.empty']()}
							</Text>
						</div>
					)
				}
				ListFooterComponent={
					drafts.length > 5 ? (
						<div className={styles.footerNote}>
							<Text align="center" color="textContrastMedium">
								{m['view.composer.text.placeholder']()}
							</Text>
						</div>
					) : null
				}
			/>
		</>
	);
}
