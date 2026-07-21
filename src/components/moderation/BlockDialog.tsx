import { useState } from 'react';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

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

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import { parseConvoView } from '#/components/dms/util';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './BlockDialog.css';

type Item = ChatBskyConvoDefs.ConvoView;

type BlockDialogProps = {
	handle: Dialog.DialogHandle;
	profile: Shadow<AnyProfileView>;
	onBlock: () => Promise<void>;
	currentConvoId?: string;
};

export function BlockDialog({ handle, profile, onBlock, currentConvoId }: BlockDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} scroll="body">
				<BlockDialogInner
					currentConvoId={currentConvoId}
					handle={handle}
					onBlock={onBlock}
					profile={profile}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function BlockDialogInner({
	currentConvoId,
	handle,
	onBlock,
	profile,
}: {
	currentConvoId?: string;
	handle: Dialog.DialogHandle;
	onBlock: () => Promise<void>;
	profile: Shadow<AnyProfileView>;
}) {
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

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage) return;
		fetchNextPage().catch((err) => {
			logger.error('Failed to load more mutual group chats', { message: err });
		});
	};

	const isBlocking = !!profile.viewer?.blocking;
	const blockActionLabel = isBlocking ? m['common.block.action.unblock']() : m['common.block.action.block']();

	return (
		<>
			<div className={css.header}>
				<Dialog.TitleRow>
					<Dialog.Title>
						{isBlocking
							? m['components.moderation.block.unblockTitle']()
							: m['components.moderation.block.confirmTitle']()}
					</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastMedium">
					{isBlocking
						? m['common.block.unblockHint']()
						: profile.associated?.labeler
							? m['components.moderation.block.descriptionLabels']()
							: m['components.moderation.block.description']()}
				</Text>
			</div>

			<Dialog.List
				data={items}
				keyExtractor={(item) => item.id}
				renderItem={(item) => (
					<MutualGroupChat
						currentConvoId={currentConvoId}
						onOptimisticallyRemoveConvo={onOptimisticallyRemoveConvo}
						onRestoreConvo={onRestoreConvo}
						profileDid={profile.did}
						view={item}
					/>
				)}
				onEndReached={onEndReached}
				isFetchingNextPage={isFetchingNextPage}
				loadingLabel={m['common.status.loading']()}
				ListHeaderComponent={
					hasMutualGroupChats ? (
						<Text className={css.groupsLabel} color="textContrastHigh" size="sm" weight="semiBold">
							{m['components.moderation.chat.mutualGroups']()}
						</Text>
					) : null
				}
				ListEmptyComponent={
					isLoading ? (
						<div className={css.loading}>
							<CenteredSpinner label={m['common.status.loading']()} size="2xl" />
						</div>
					) : null
				}
			/>

			<Dialog.Footer>
				<Dialog.Actions direction="column">
					<Button
						color={isBlocking ? 'primary' : 'negative'}
						label={blockActionLabel}
						onClick={() => {
							handle.close();
							void onBlock();
						}}
						size="large"
					>
						<ButtonText>{blockActionLabel}</ButtonText>
					</Button>
					<Button
						color="secondary"
						label={m['common.a11y.closeDialog']()}
						onClick={() => handle.close()}
						size="large"
					>
						<ButtonText>{m['common.action.cancel']()}</ButtonText>
					</Button>
				</Dialog.Actions>
			</Dialog.Footer>
		</>
	);
}

function MutualGroupChat({
	currentConvoId,
	onOptimisticallyRemoveConvo,
	onRestoreConvo,
	profileDid,
	view,
}: {
	currentConvoId?: string;
	onOptimisticallyRemoveConvo: (convoId: string) => void;
	onRestoreConvo: (convoId: string) => void;
	profileDid: Did;
	view: ChatBskyConvoDefs.ConvoView;
}) {
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
		<div className={css.row}>
			<div className={css.rowMain}>
				<AvatarBubbles profiles={convo.members} size={40} />
				<div className={css.rowText}>
					<Text numberOfLines={1} size="md" weight="semiBold">
						{convo.details.name}
					</Text>
					{isViewerOwner ? (
						<Text color="textContrastMedium" size="xs">
							{m['components.moderation.chat.youOwn']()}
						</Text>
					) : isProfileOwner ? (
						<Text color="textContrastMedium" size="xs">
							{m['components.moderation.chat.theyOwn']()}
						</Text>
					) : null}
				</div>
			</div>
			{isViewerOwner ? (
				<Button
					color="negative_subtle"
					disabled={isRemovePending}
					label={m['components.moderation.chat.removeMember']()}
					onClick={() => {
						onOptimisticallyRemoveConvo(view.id);
						removeMembers({ members: [profileDid] });
					}}
					size="small"
				>
					<ButtonText>{m['components.moderation.chat.removeMember']()}</ButtonText>
					{isRemovePending && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
				</Button>
			) : isCurrentConvo ? (
				<Text color="textContrastMedium" size="sm" weight="medium">
					{m['components.moderation.chat.current']()}
				</Text>
			) : (
				<Button
					color="secondary"
					disabled={isLeavePending}
					label={m['common.chat.action.leave']()}
					onClick={() => {
						onOptimisticallyRemoveConvo(view.id);
						leaveConvo();
					}}
					size="small"
				>
					<ButtonText>{m['common.chat.action.leave']()}</ButtonText>
					{isLeavePending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
				</Button>
			)}
		</div>
	);
}
