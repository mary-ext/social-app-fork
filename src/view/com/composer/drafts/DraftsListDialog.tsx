import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Keyboard } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';

import { useCallOnce } from '#/lib/once';

import { PageX_Stroke2_Corner0_Rounded_Large as PageXIcon } from '#/components/icons/PageX';
import { Button, ButtonText } from '#/components/web/Button';
import { CenteredSpinner } from '#/components/web/CenteredSpinner';
import * as Sheet from '#/components/web/Sheet';
import { Text } from '#/components/web/Text';

import { DraftItem } from './DraftItem';
import * as styles from './DraftsListDialog.css';
import { useDeleteDraftMutation, useDraftsQuery } from './state/queries';
import type { DraftSummary } from './state/schema';

export function DraftsListDialog({
	handle,
	onSelectDraft,
}: {
	handle: Sheet.SheetHandle;
	onSelectDraft: (draft: DraftSummary) => void;
}) {
	const { t: l } = useLingui();
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

	const scrollRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	// keep the observer stable while always calling the latest handler — it closes over fresh pagination state.
	const onEndReached = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
	const onEndReachedRef = useRef(onEndReached);
	onEndReachedRef.current = onEndReached;

	const showList = !isLoading && drafts.length > 0;
	useEffect(() => {
		if (!showList) {
			return;
		}
		const sentinel = sentinelRef.current;
		const root = scrollRef.current;
		if (!sentinel || !root) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					onEndReachedRef.current();
				}
			},
			// prefetch roughly a screen ahead, mirroring the old FlatList's onEndReachedThreshold.
			{ root, rootMargin: '600px 0px' },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [showList]);

	return (
		<Sheet.Root handle={handle}>
			<Sheet.Popup label={l`Drafts`}>
				<Sheet.Header.Outer>
					<Sheet.Header.Slot>
						<Button
							label={l`Back`}
							onClick={() => handle.close()}
							size="small"
							color="primary"
							variant="ghost"
						>
							<ButtonText size="md">
								<Trans>Back</Trans>
							</ButtonText>
						</Button>
					</Sheet.Header.Slot>
					<Sheet.Header.Content>
						<Sheet.Header.TitleText>
							<Trans>Drafts</Trans>
						</Sheet.Header.TitleText>
					</Sheet.Header.Content>
					<Sheet.Header.Slot />
				</Sheet.Header.Outer>
				<div ref={scrollRef} className={styles.list}>
					{isLoading ? (
						<div className={styles.loading}>
							<CenteredSpinner label={l`Loading drafts`} size="lg" />
						</div>
					) : drafts.length === 0 ? (
						<div className={styles.empty}>
							<span className={styles.emptyIcon}>
								<PageXIcon width={48} height={48} fill="currentColor" />
							</span>
							<Text size="md" weight="medium" color="textContrastHigh" align="center">
								<Trans>No drafts yet</Trans>
							</Text>
						</div>
					) : (
						<div className={styles.listContent}>
							{drafts.map((item) => (
								<div key={item.id} className={styles.itemWrap}>
									<DraftItem draft={item} onSelect={handleSelectDraft} onDelete={handleDeleteDraft} />
								</div>
							))}
							{drafts.length > 5 && (
								<div className={styles.footerNote}>
									<Text align="center" color="textContrastMedium">
										<Trans>So many thoughts, you should post one</Trans>
									</Text>
								</div>
							)}
							{isFetchingNextPage && <CenteredSpinner label={l`Loading drafts`} size="lg" />}
							<div ref={sentinelRef} aria-hidden />
						</div>
					)}
				</div>
			</Sheet.Popup>
		</Sheet.Root>
	);
}
