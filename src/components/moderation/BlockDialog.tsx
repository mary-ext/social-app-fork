import { useState } from 'react';
import { View } from 'react-native';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';

import { useQueryClient } from '@tanstack/react-query';

import { isNetworkError } from '#/lib/strings/errors';

import type { Shadow } from '#/state/cache/types';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import {
	createListMutualGroupsQueryKey,
	useListMutualGroupsQuery,
} from '#/state/queries/messages/list-mutual-groups';
import { useRemoveFromGroupChat } from '#/state/queries/messages/remove-from-group';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import type { DialogControlProps } from '#/components/Dialog';
import { parseConvoView } from '#/components/dms/util';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

type Item = ChatBskyConvoDefs.ConvoView;

type BlockDialogProps = {
	control: DialogControlProps;
	profile: Shadow<AnyProfileView>;
	onBlock: () => Promise<void>;
	currentConvoId?: string;
};

export function BlockDialog({ control, profile, onBlock, currentConvoId }: BlockDialogProps) {
	return (
		<Dialog.Outer control={control}>
			<View style={[a.relative]}>
				<Dialog.Handle />
				<BlockDialogInner
					control={control}
					profile={profile}
					onBlock={onBlock}
					currentConvoId={currentConvoId}
				/>
				<Dialog.Close />
			</View>
		</Dialog.Outer>
	);
}

function BlockDialogInner({
	control,
	profile,
	onBlock,
	currentConvoId,
}: {
	control: DialogControlProps;
	profile: Shadow<AnyProfileView>;
	onBlock: () => Promise<void>;
	currentConvoId?: string;
}) {
	const t = useTheme();
	const [headerHeight, setHeaderHeight] = useState(0);
	const [footerHeight, setFooterHeight] = useState(0);

	// Optimistically hide convos the viewer has left or removed the profile from, before the query
	// refetches. We don't expect many items here, so a simple filter is fine.
	const [removedConvoIds, setRemovedConvoIds] = useState<Set<string>>(() => new Set());
	const onOptimisticallyRemoveConvo = (convoId: string) => {
		setRemovedConvoIds((prev) => {
			const next = new Set(prev);
			next.add(convoId);
			return next;
		});
	};
	const onRestoreConvo = (convoId: string) => {
		setRemovedConvoIds((prev) => {
			const next = new Set(prev);
			next.delete(convoId);
			return next;
		});
	};

	const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useListMutualGroupsQuery({
		subject: profile.did,
		enabled: !profile.viewer?.blocking,
	});
	const items: Item[] = (data?.pages.flatMap((page) => page.convos) ?? []).filter(
		(item) => !removedConvoIds.has(item.id),
	);
	const hasMutualGroupChats = items.length > 0;

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more mutual group chats', { message: err });
		}
	};

	const renderItems = ({ item }: { item: Item }) => {
		return (
			<MutualGroupChat
				view={item}
				profileDid={profile.did}
				currentConvoId={currentConvoId}
				onOptimisticallyRemoveConvo={onOptimisticallyRemoveConvo}
				onRestoreConvo={onRestoreConvo}
			/>
		);
	};

	const listHeader = (
		<View style={[t.atoms.bg]} onLayout={(evt) => setHeaderHeight(evt.nativeEvent.layout.height)}>
			<View style={[a.pb_lg, a.gap_sm]}>
				<Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
					{profile.viewer?.blocking
						? m['components.moderation.block.unblockTitle']()
						: m['components.moderation.block.confirmTitle']()}
				</Text>
				<Text style={[a.text_md, t.atoms.text_contrast_medium]}>
					{profile.viewer?.blocking
						? m['common.block.unblockHint']()
						: profile.associated?.labeler
							? m['components.moderation.block.descriptionLabels']()
							: m['components.moderation.block.description']()}
				</Text>
			</View>
			{hasMutualGroupChats ? (
				<View style={[a.pt_sm, a.pb_xs, t.atoms.bg]}>
					<Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_high]}>
						{m['components.moderation.chat.mutualGroups']()}
					</Text>
				</View>
			) : null}
		</View>
	);

	const footer = (
		<View style={[a.w_full, a.gap_sm, a.justify_end]}>
			<Button
				color={profile.viewer?.blocking ? undefined : 'negative'}
				size="large"
				label={
					profile.viewer?.blocking ? m['common.block.action.unblock']() : m['common.block.action.block']()
				}
				onPress={() => control.close(() => void onBlock())}
			>
				<ButtonText>
					{profile.viewer?.blocking ? m['common.block.action.unblock']() : m['common.block.action.block']()}
				</ButtonText>
			</Button>
			<Button
				color="secondary"
				size="large"
				label={m['common.a11y.closeDialog']()}
				onPress={() => control.close()}
			>
				<ButtonText>{m['common.action.cancel']()}</ButtonText>
			</Button>
		</View>
	);

	if (isLoading || !hasMutualGroupChats) {
		return (
			<Dialog.ScrollableInner
				label={
					profile.viewer?.blocking ? m['common.block.action.unblock']() : m['common.block.action.block']()
				}
				style={[{ maxWidth: 420 }]}
			>
				{listHeader}
				{isLoading ? (
					<View style={[a.pb_2xl, a.align_center, a.justify_center]}>
						<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
					</View>
				) : null}
				{footer}
			</Dialog.ScrollableInner>
		);
	}

	return (
		<Dialog.InnerFlatList
			label={profile.viewer?.blocking ? m['common.block.action.unblock']() : m['common.block.action.block']()}
			data={items}
			renderItem={renderItems}
			ListHeaderComponent={listHeader}
			stickyHeaderIndices={[0]}
			ListFooterComponent={
				isFetchingNextPage ? (
					<View style={[a.py_lg, a.align_center, a.justify_center]}>
						<Spinner color="default" label={m['common.status.loading']()} size="xl" />
					</View>
				) : null
			}
			footer={
				<Dialog.FlatListFooter onLayout={(evt) => setFooterHeight(evt.nativeEvent.layout.height)}>
					{footer}
				</Dialog.FlatListFooter>
			}
			contentContainerStyle={[a.gap_0, { paddingBottom: footerHeight }]}
			scrollIndicatorInsets={{ top: headerHeight, bottom: footerHeight }}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={0.5}
			style={[a.h_full_vh, { maxHeight: 600 }]}
			webInnerStyle={[{ maxWidth: 420 }]}
		/>
	);
}

function MutualGroupChat({
	view,
	profileDid,
	currentConvoId,
	onOptimisticallyRemoveConvo,
	onRestoreConvo,
}: {
	view: ChatBskyConvoDefs.ConvoView;
	profileDid: string;
	currentConvoId?: string;
	onOptimisticallyRemoveConvo: (convoId: string) => void;
	onRestoreConvo: (convoId: string) => void;
}) {
	const t = useTheme();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();

	const convo = parseConvoView(view, currentAccount?.did);

	const { mutate: leaveConvo, isPending: isLeavePending } = useLeaveConvo(convo?.view.id, {
		onSuccess: () => {
			Toast.show(m['components.moderation.chat.leftToast']());
			void queryClient.invalidateQueries({
				queryKey: createListMutualGroupsQueryKey({ subject: profileDid }),
			});
		},
		onError: (error) => {
			onRestoreConvo(view.id);
			logger.error('Error leaving group chat', { message: error });
			let errorMessage = m['components.dms.leave.error.leave']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError && error.error === 'InvalidConvo') {
				errorMessage = m['components.moderation.chat.error.notFound']();
			} else if (error instanceof ClientResponseError && error.error === 'OwnerCannotLeave') {
				errorMessage = m['components.moderation.chat.error.ownerCannotLeave']();
			}
			Toast.show(errorMessage, { type: 'error' });
		},
	});

	const { mutate: removeMembers, isPending: isRemovePending } = useRemoveFromGroupChat(convo?.view.id, {
		onSuccess: () => {
			Toast.show(m['components.moderation.chat.memberRemovedToast']());
			void queryClient.invalidateQueries({
				queryKey: createListMutualGroupsQueryKey({ subject: profileDid }),
			});
		},
		onError: (error) => {
			onRestoreConvo(view.id);
			logger.error('Error removing group chat member', { message: error });
			let errorMessage = m['components.moderation.chat.error.removeMember']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError && error.error === 'InvalidConvo') {
				errorMessage = m['components.moderation.chat.error.notFound']();
			} else if (error instanceof ClientResponseError && error.error === 'InsufficientRole') {
				errorMessage = m['components.moderation.chat.error.mustBeOwnerToRemove']();
			}
			Toast.show(errorMessage, { type: 'error' });
		},
	});

	if (!convo || convo.kind !== 'group') return null;

	const owner = convo.primaryMember;
	const isViewerOwner = owner?.did != null && owner.did === currentAccount?.did;
	const isProfileOwner = owner?.did != null && owner.did === profileDid;
	const isCurrentConvo = view.id === currentConvoId;

	return (
		<View style={[a.flex_row, a.align_center, a.gap_sm, a.justify_between, a.py_sm]}>
			<View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
				<AvatarBubbles profiles={convo.members} size={40} />
				<View style={[a.flex_1]}>
					<Text style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
						{convo.details.name}
					</Text>
					{isViewerOwner ? (
						<Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
							{m['components.moderation.chat.youOwn']()}
						</Text>
					) : isProfileOwner ? (
						<Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
							{m['components.moderation.chat.theyOwn']()}
						</Text>
					) : null}
				</View>
			</View>
			{isViewerOwner ? (
				<Button
					color="negative_subtle"
					disabled={isRemovePending}
					label={m['components.moderation.chat.removeMember']()}
					size="small"
					onPress={() => {
						onOptimisticallyRemoveConvo(view.id);
						removeMembers({ members: [profileDid] });
					}}
				>
					<ButtonText>{m['components.moderation.chat.removeMember']()}</ButtonText>
					{isRemovePending && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
				</Button>
			) : isCurrentConvo ? (
				<Text style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}>
					{m['components.moderation.chat.current']()}
				</Text>
			) : (
				<Button
					color="secondary"
					disabled={isLeavePending}
					label={m['common.chat.action.leave']()}
					size="small"
					onPress={() => {
						onOptimisticallyRemoveConvo(view.id);
						leaveConvo();
					}}
				>
					<ButtonText>{m['common.chat.action.leave']()}</ButtonText>
					{isLeavePending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
				</Button>
			)}
		</View>
	);
}
