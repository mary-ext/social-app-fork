import { useCallback, useEffect, useMemo } from 'react';
import { FlatList, Keyboard, View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';

import { useCallOnce } from '#/lib/once';

import { EmptyState } from '#/view/com/util/EmptyState';

import { atoms as a, select, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import { PageX_Stroke2_Corner0_Rounded_Large as PageXIcon } from '#/components/icons/PageX';
import { ListFooter } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import * as Sheet from '#/components/web/Sheet';

import { DraftItem } from './DraftItem';
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
	const t = useTheme();
	const { gtPhone } = useBreakpoints();
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

	const renderItem = useCallback(
		({ item }: { item: DraftSummary }) => {
			return (
				<View style={[gtPhone ? [a.px_md, a.pt_md] : [a.px_sm, a.pt_sm]]}>
					<DraftItem draft={item} onSelect={handleSelectDraft} onDelete={handleDeleteDraft} />
				</View>
			);
		},
		[handleSelectDraft, handleDeleteDraft, gtPhone],
	);

	const onEndReached = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const emptyComponent = useMemo(() => {
		if (isLoading) {
			return (
				<View style={[a.py_xl, a.align_center]}>
					<Loader size="lg" />
				</View>
			);
		}
		return (
			<EmptyState
				icon={PageXIcon}
				message={l`No drafts yet`}
				style={[a.justify_center, { minHeight: 500 }]}
			/>
		);
	}, [isLoading, l]);

	const footerComponent = useMemo(
		() => (
			<>
				{drafts.length > 5 && (
					<View style={[a.align_center, a.py_2xl]}>
						<Text style={[a.text_center, t.atoms.text_contrast_medium]}>
							<Trans>So many thoughts, you should post one</Trans>
						</Text>
					</View>
				)}
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					style={[a.border_transparent]}
				/>
			</>
		),
		[isFetchingNextPage, hasNextPage, drafts.length, t],
	);

	return (
		<Sheet.Root handle={handle}>
			<Sheet.Popup label={l`Drafts`}>
				<Sheet.Header.Outer>
					<Sheet.Header.Slot>
						<Button
							label={l`Back`}
							onPress={() => handle.close()}
							size="small"
							color="primary"
							variant="ghost"
						>
							<ButtonText style={[a.text_md]}>
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
				<FlatList
					data={drafts}
					renderItem={renderItem}
					keyExtractor={(item: DraftSummary) => item.id}
					ListEmptyComponent={emptyComponent}
					ListFooterComponent={footerComponent}
					onEndReached={onEndReached}
					onEndReachedThreshold={0.5}
					style={[
						a.flex_1,
						{ minHeight: 0 },
						{
							backgroundColor: select(t.name, {
								light: t.palette.contrast_50,
								dark: t.palette.contrast_0,
								dim: '#000000',
							}),
						},
					]}
					contentContainerStyle={[a.pb_xl]}
				/>
			</Sheet.Popup>
		</Sheet.Root>
	);
}
