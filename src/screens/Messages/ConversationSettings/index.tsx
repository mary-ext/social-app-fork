import { useRef, useState } from 'react';

import type { ChatBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ClientResponseError } from '@atcute/client';

import { useTitle } from '#/lib/hooks/useTitle';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useConvoQuery } from '#/state/queries/messages/conversation';
import { useEditGroupChatName } from '#/state/queries/messages/edit-group-chat-name';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useListConvoMembersQuery } from '#/state/queries/messages/list-convo-members';
import { useListJoinRequestsQuery } from '#/state/queries/messages/list-join-requests';
import { useLockConvo } from '#/state/queries/messages/lock-conversation';
import { useMuteConvo } from '#/state/queries/messages/mute-conversation';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import * as Dialog from '#/components/Dialog';
import { AfterReportConversationDialog } from '#/components/dms/AfterReportConversationDialog';
import { ReportConversationDialog } from '#/components/dms/ReportConversationDialog';
import { type ConvoWithDetails, type GroupConvoMember, parseConvoView } from '#/components/dms/util';
import { Error } from '#/components/Error';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon } from '#/components/icons/ArrowBoxLeft';
import {
	Bell2_Stroke2_Corner0_Rounded as BellIcon,
	Bell2Off_Stroke2_Corner0_Rounded as BellOffIcon,
} from '#/components/icons/Bell2';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { EditBig_Stroke2_Corner2_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useNavigate, useParams, useRouter } from '#/routes';

import { InviteLinkDialog } from '../components/InviteLinkDialog';
import { useIsWithinSplitView } from '../components/splitView/context';
import { AddMembersLink } from './AddMembersLink';
import * as css from './index.css';
import { Member, MemberPlaceholder } from './Member';
import { MembersAndRequests } from './MembersAndRequests';
import { EditNamePrompt, LeaveAndLockChatPrompt, LeaveChatPrompt, LockChatPrompt } from './prompts';
import { SettingsButton } from './SettingsButton';

type Item =
	| { type: 'membersAndRequests'; key: string }
	| { type: 'addMembersLink'; key: string }
	| {
			type: 'chatMember';
			key: string;
			profile: GroupConvoMember;
			status: 'owner' | 'standard';
	  }
	| {
			type: 'chatMemberPlaceholder';
			key: string;
	  };

export function MessagesConversationSettingsScreen() {
	const [{ conversation: convoId }] = useParams('MessagesConversationSettings');
	const navigate = useNavigate();
	const router = useRouter();

	useTitle(m['common.chat.settingsTitle']());

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton
					onClick={(evt) => {
						// deep-linking straight to settings leaves no back entry; send back to the conversation
						if (!router.canGoBack) {
							evt.preventDefault();
							navigate('MessagesConversation', { conversation: convoId });
						}
					}}
				/>
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.chat.settingsTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<SettingsInner convoId={convoId} />
		</Layout.Screen>
	);
}

function SettingsInner({ convoId }: { convoId: string }) {
	const router = useRouter();
	const moderationOpts = useModerationOpts();
	const { currentAccount } = useSession();
	const { data: convoData, error, refetch } = useConvoQuery({ convoId });

	const convo = convoData ? parseConvoView(convoData, currentAccount?.did) : null;

	if (error) {
		return (
			<Error
				title={m['common.error.generic']()}
				message={m['screens.messages.chatSettings.loadError']()}
				onRetry={() => refetch()}
				sideBorders={false}
			/>
		);
	}

	if (!convo || !moderationOpts) {
		return (
			<div className={css.loading}>
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			</div>
		);
	}

	if (convo.kind !== 'group') {
		return (
			<Error
				title={m['screens.messages.conversation.wrongTypeError']()}
				message={m['screens.messages.conversation.groupOnlyError']()}
				onGoBack={() => {
					if (router.canGoBack) {
						router.back();
					} else {
						router.replace(router.build('Messages'));
					}
				}}
			/>
		);
	}

	return <GroupSettings convo={convo} moderationOpts={moderationOpts} />;
}

function keyExtractor(item: Item) {
	return item.key;
}

function isGroupMember(member: ChatBskyActorDefs.ProfileViewBasic): member is GroupConvoMember {
	// Kind is missing when the account has been deleted.
	return member.kind === undefined || member.kind.$type === 'chat.bsky.actor.defs#groupConvoMember';
}

function GroupSettings({
	convo,
	moderationOpts,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	moderationOpts: ModerationOptions;
}) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const { isWithinSplitView } = useIsWithinSplitView();
	const { currentAccount } = useSession();

	const primaryMember = convo.primaryMember;
	const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did;

	const { data: memberListData = [] } = useListConvoMembersQuery({
		convoId: convo.view.id,
		placeholderData: convo.members,
	});

	const { data: joinRequestsData, hasNextPage: hasMoreRequests } = useListJoinRequestsQuery({
		convoId: convo.view.id,
		enabled: isOwner,
	});
	const requestCount = joinRequestsData?.pages.reduce((sum, page) => sum + page.requests.length, 0) ?? 0;

	// oxlint-disable-next-line unicorn/no-array-sort -- sorting the array `filter` just returned
	const groupMembers = memberListData.filter(isGroupMember).sort((memberA, memberB) => {
		const aIsOwner = memberA.did === primaryMember?.did;
		const bIsOwner = memberB.did === primaryMember?.did;
		const aIsSelf = memberA.did === currentAccount?.did;
		const bIsSelf = memberB.did === currentAccount?.did;
		if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1;
		if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1;
		// surface blocked members to the owner so they can be removed
		if (isOwner) {
			const aBlocked = !!isBlockedOrBlocking(memberA);
			const bBlocked = !!isBlockedOrBlocking(memberB);
			if (aBlocked !== bBlocked) return aBlocked ? -1 : 1;
		}
		return 0;
	});

	const items: Item[] = [
		{
			type: 'membersAndRequests',
			key: 'members-and-requests',
		},
		...(isOwner && convo.details.lockStatus === 'unlocked'
			? [{ type: 'addMembersLink', key: 'add-members-link' } as const]
			: []),
	];
	items.push(
		...groupMembers.map(
			(profile): Item => ({
				type: 'chatMember',
				key: profile.did,
				profile,
				status: primaryMember?.did === profile.did ? 'owner' : 'standard',
			}),
		),
	);
	const placeholderCount = Math.max(0, convo.details.memberCount - groupMembers.length);
	for (let i = 0; i < placeholderCount; i++) {
		items.push({
			type: 'chatMemberPlaceholder',
			key: `chat-member-placeholder-${i}`,
		});
	}

	function renderItem({ item }: { item: Item }) {
		switch (item.type) {
			case 'membersAndRequests':
				return (
					<MembersAndRequests
						convo={convo}
						requestCount={requestCount}
						hasMoreRequests={hasMoreRequests}
						isOwner={isOwner}
					/>
				);
			case 'addMembersLink':
				return <AddMembersLink convo={convo} />;
			case 'chatMember':
				return <Member convo={convo} profile={item.profile} status={item.status} isOwner={isOwner} />;
			case 'chatMemberPlaceholder':
				return <MemberPlaceholder />;
			default:
				return null;
		}
	}

	const list = (
		<List
			data={items}
			estimateHeight={76}
			keyExtractor={keyExtractor}
			ListHeaderComponent={<SettingsHeader convo={convo} isOwner={isOwner} moderationOpts={moderationOpts} />}
			ListFooterComponent={<ListFooter border={false} />}
			renderItem={renderItem}
			scrollRoot={isWithinSplitView ? scrollContainerRef : undefined}
		/>
	);

	if (isWithinSplitView) {
		return (
			<div className={css.scroller} ref={scrollContainerRef}>
				{list}
			</div>
		);
	}

	return list;
}

function SettingsHeader({
	convo,
	isOwner,
	moderationOpts,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	isOwner: boolean;
	moderationOpts: ModerationOptions;
}) {
	const router = useRouter();

	const groupName = convo.details.name;
	const [newGroupName, setNewGroupName] = useState(groupName);
	const [editNameInputKey, setEditNameInputKey] = useState(0);

	const lockStatus = convo.details.lockStatus;

	const { joinLink } = convo.details;
	const isJoinLinkEnabled = isOwner || joinLink?.enabledStatus === 'enabled';

	const reportSubjectDid = convo.primaryMember?.did;

	const { mutate: editGroupName, isPending: isEditingName } = useEditGroupChatName(convo.view.id, {
		onSuccess: () => {
			Toast.show(m['screens.messages.groupName.updatedToast']());
		},
		onError: (e) => {
			setNewGroupName(groupName);
			logger.error('Failed to edit group chat name', { message: e });
			Toast.show(m['screens.messages.groupName.edit.error'](), { type: 'error' });
		},
	});

	const { mutate: muteConvo, isPending: isMuting } = useMuteConvo(convo.view.id, {
		onSuccess: (data) => {
			if (data.convo.muted) {
				Toast.show(m['screens.messages.mute.mutedToast']());
			} else {
				Toast.show(m['screens.messages.mute.unmutedToast']());
			}
		},
		onError: (e) => {
			logger.error('Failed to mute group chat', { message: e });
			Toast.show(m['screens.messages.mute.error'](), { type: 'error' });
		},
	});

	const { mutate: leaveConvo, isPending: isLeaving } = useLeaveConvo(convo.view.id, {
		onSuccess: () => {
			router.replace(router.build('Messages'));
		},
		onError: (e) => {
			logger.error('Failed to leave group chat', { message: e });
			Toast.show(m['screens.messages.leave.error'](), { type: 'error' });
		},
	});

	const {
		mutate: lockConvo,
		mutateAsync: lockConvoAsync,
		isPending: isLocking,
	} = useLockConvo(convo.view.id, {
		onSuccess: (data, { silent }) => {
			if (data.convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') return;
			if (silent) return;
			if (data.convo.kind.lockStatus === 'locked') {
				Toast.show(m['screens.messages.lock.lockedToast']());
			} else {
				Toast.show(m['screens.messages.lock.unlockedToast']());
			}
		},
		onError: (e, { lock }) => {
			if (lock) {
				logger.error('Failed to lock group chat', { message: e });
				Toast.show(m['screens.messages.lock.error.lock'](), { type: 'error' });
			} else if (e instanceof ClientResponseError && e.error === 'ConvoLockedByModeration') {
				Toast.show(m['screens.messages.lock.chatLockedMod'](), { type: 'error' });
			} else {
				logger.error('Failed to unlock group chat', { message: e });
				Toast.show(m['screens.messages.lock.error.unlock'](), { type: 'error' });
			}
		},
	});

	const leaveAndLockConvo = async () => {
		try {
			if (lockStatus === 'unlocked') {
				await lockConvoAsync({ lock: true, silent: true });
			}
		} catch {
			// handled by onError in useLockConvo
			return;
		}
		// owners can only leave a locked chat
		leaveConvo();
	};

	const inviteLinkDialog = Dialog.useDialogHandle();
	const editNamePrompt = Prompt.usePromptHandle();
	const lockChatPrompt = Prompt.usePromptHandle();
	const leaveChatPrompt = Prompt.usePromptHandle();
	const leaveAndLockChatPrompt = Prompt.usePromptHandle();
	const reportHandle = Dialog.useDialogHandle();
	const deleteHandle = Dialog.useDialogHandle();

	const handleToggleMute = () => {
		muteConvo({ mute: !convo.view.muted });
	};

	const handlePromptName = () => {
		setNewGroupName(groupName);
		setEditNameInputKey((k) => k + 1);
		editNamePrompt.open(null);
	};

	const handleEditName = () => {
		editGroupName({ name: newGroupName });
	};

	const handleConfirmLock = () => {
		lockConvo({ lock: true });
	};

	const handleUnlock = () => {
		lockConvo({ lock: false });
	};

	const createdAt = new Date(convo.details.createdAt);

	// a lock forced by a moderation action cannot be undone by the owner.
	const canLockGroupChat =
		isOwner && lockStatus !== 'locked-permanently' && !convo.details.lockStatusModerationOverride;

	return (
		<>
			<div className={css.headerBlock}>
				<div className={css.avatarRow}>
					<AvatarBubbles profiles={convo.members} />
				</div>
				<Text align="center" className={css.groupName} size="_2xl" weight="bold">
					{groupName}
				</Text>
				<Text align="center" className={css.createdAt} color="textContrastHigh" size="sm">
					{m['screens.messages.inviteLink.created']({
						date: createdAt,
					})}
				</Text>
				<div className={css.buttonRow}>
					<SettingsButton
						color={convo.view.muted ? 'negative_subtle' : 'secondary'}
						disabled={isMuting || lockStatus !== 'unlocked'}
						icon={convo.view.muted ? BellOffIcon : BellIcon}
						label={
							convo.view.muted
								? m['screens.messages.mute.action.unmute']()
								: m['screens.messages.mute.action.mute']()
						}
						text={convo.view.muted ? m['common.mute.status']() : m['common.mute.action.mute']()}
						onClick={handleToggleMute}
					/>
					{isOwner ? (
						<SettingsButton
							disabled={isEditingName || lockStatus !== 'unlocked'}
							icon={EditIcon}
							label={m['screens.messages.groupName.edit.a11y']()}
							text={m['screens.messages.groupName.edit.short']()}
							onClick={handlePromptName}
						/>
					) : null}
					{isJoinLinkEnabled ? (
						<Dialog.Trigger
							handle={inviteLinkDialog}
							render={
								<SettingsButton
									disabled={lockStatus !== 'unlocked'}
									icon={ChainLinkIcon}
									label={
										isOwner
											? m['screens.messages.inviteLink.manage.label']()
											: m['screens.messages.inviteLink.view.hint']()
									}
									text={m['screens.messages.inviteLink.label']()}
								/>
							}
						/>
					) : null}
					{canLockGroupChat ? (
						<SettingsButton
							color={lockStatus === 'locked' ? 'negative_subtle' : 'secondary'}
							disabled={isLocking}
							icon={LockIcon}
							label={
								lockStatus === 'locked'
									? m['screens.messages.lock.a11y.unlock']()
									: m['screens.messages.lock.a11y.lock']()
							}
							text={
								lockStatus === 'locked'
									? m['screens.messages.lock.label']()
									: m['screens.messages.lock.action.lock']()
							}
							onClick={lockStatus === 'locked' ? handleUnlock : () => lockChatPrompt.open(null)}
						/>
					) : null}
					{!isOwner && reportSubjectDid ? (
						<SettingsButton
							icon={FlagIcon}
							label={m['screens.messages.report.group']()}
							text={m['common.action.report']()}
							onClick={() => reportHandle.open(null)}
						/>
					) : null}
					<SettingsButton
						disabled={isLeaving || (isOwner && isLocking)}
						icon={ArrowBoxLeftIcon}
						label={m['screens.messages.leave.a11y']()}
						text={m['common.action.leave']()}
						onClick={isOwner ? () => leaveAndLockChatPrompt.open(null) : () => leaveChatPrompt.open(null)}
					/>
				</div>
			</div>
			<EditNamePrompt
				handle={editNamePrompt}
				value={newGroupName}
				inputKey={editNameInputKey}
				onChangeText={setNewGroupName}
				onConfirm={handleEditName}
			/>
			{convo.primaryMember && (
				<InviteLinkDialog
					convo={convo}
					owner={convo.primaryMember}
					handle={inviteLinkDialog}
					isOwner={isOwner}
					moderationOpts={moderationOpts}
				/>
			)}
			<LockChatPrompt handle={lockChatPrompt} onConfirm={handleConfirmLock} />
			<LeaveChatPrompt handle={leaveChatPrompt} groupName={groupName} onConfirm={leaveConvo} />
			<LeaveAndLockChatPrompt
				handle={leaveAndLockChatPrompt}
				groupName={groupName}
				onConfirm={() => void leaveAndLockConvo()}
			/>
			{reportSubjectDid ? (
				<>
					<ReportConversationDialog
						handle={reportHandle}
						convoId={convo.view.id}
						did={reportSubjectDid}
						onAfterSubmit={() => deleteHandle.open(null)}
					/>
					<AfterReportConversationDialog
						handle={deleteHandle}
						currentScreen="conversation"
						params={{ convoId: convo.view.id, did: reportSubjectDid }}
					/>
				</>
			) : null}
		</>
	);
}
