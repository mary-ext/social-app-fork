import { useState } from 'react';
import { View } from 'react-native';

import type { ChatBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ClientResponseError } from '@atcute/client';

import { useNavigation } from '@react-navigation/native';

import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';

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

import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { Button, type ButtonColor, ButtonIcon } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
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
import type { Props as SVGIconProps } from '#/components/icons/common';
import { EditBig_Stroke2_Corner2_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Layout from '#/components/Layout';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import { InviteLinkDialog } from '../components/InviteLinkDialog';
import { AddMembersLink } from './AddMembersLink';
import { Member, MemberPlaceholder } from './Member';
import { MembersAndRequests } from './MembersAndRequests';
import { EditNamePrompt, LeaveAndLockChatPrompt, LeaveChatPrompt, LockChatPrompt } from './prompts';

type Item =
	| { type: 'MEMBERS_AND_REQUESTS'; key: string }
	| { type: 'ADD_MEMBERS_LINK'; key: string }
	| {
			type: 'CHAT_MEMBER';
			key: string;
			profile: GroupConvoMember;
			status: 'owner' | 'standard';
	  }
	| {
			type: 'CHAT_MEMBER_PLACEHOLDER';
			key: string;
	  };

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesConversationSettings'>;

export function MessagesConversationSettingsScreen({ route }: Props) {
	const convoId = route.params.conversation;
	const navigation = useNavigation<NavigationProp>();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton
					onPress={(evt) => {
						// deep-linking straight to settings leaves no back entry; send back to the conversation
						if (!navigation.canGoBack()) {
							evt.preventDefault();
							navigation.navigate('MessagesConversation', { conversation: convoId });
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
	const navigation = useNavigation<NavigationProp>();
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
			<View style={[a.flex_1, a.align_center, a.justify_center]}>
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			</View>
		);
	}

	if (convo.kind !== 'group') {
		return (
			<Error
				title={m['screens.messages.conversation.wrongTypeError']()}
				message={m['screens.messages.conversation.groupOnlyError']()}
				onGoBack={() => {
					if (navigation.canGoBack()) {
						navigation.goBack();
					} else {
						navigation.replace('Messages', { animation: 'pop' });
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
	const [isPTRing, setIsPTRing] = useState(false);

	const initialNumToRender = useInitialNumToRender({ minItemHeight: 68 });
	const bottomBarOffset = useBottomBarOffset();

	const { currentAccount } = useSession();

	const primaryMember = convo.primaryMember;
	const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did;

	const { data: memberListData = [], refetch } = useListConvoMembersQuery({
		convoId: convo.view.id,
		placeholderData: convo.members,
	});

	const { data: joinRequestsData, hasNextPage: hasMoreRequests } = useListJoinRequestsQuery({
		convoId: convo.view.id,
		enabled: isOwner,
	});
	const requestCount = joinRequestsData?.pages.reduce((sum, page) => sum + page.requests.length, 0) ?? 0;

	const groupMembers = memberListData.filter(isGroupMember).sort((a, b) => {
		const aIsOwner = a.did === primaryMember?.did;
		const bIsOwner = b.did === primaryMember?.did;
		const aIsSelf = a.did === currentAccount?.did;
		const bIsSelf = b.did === currentAccount?.did;
		if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1;
		if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1;
		// surface blocked members to the owner so they can be removed
		if (isOwner) {
			const aBlocked = !!isBlockedOrBlocking(a);
			const bBlocked = !!isBlockedOrBlocking(b);
			if (aBlocked !== bBlocked) return aBlocked ? -1 : 1;
		}
		return 0;
	});

	const items: Item[] = [
		{
			type: 'MEMBERS_AND_REQUESTS',
			key: 'members-and-requests',
		},
		...(isOwner && convo.details.lockStatus === 'unlocked'
			? [{ type: 'ADD_MEMBERS_LINK', key: 'add-members-link' } as const]
			: []),
	];
	items.push(
		...groupMembers.map(
			(profile): Item => ({
				type: 'CHAT_MEMBER',
				key: profile.did,
				profile,
				status: primaryMember?.did === profile.did ? 'owner' : 'standard',
			}),
		),
	);
	const placeholderCount = Math.max(0, convo.details.memberCount - groupMembers.length);
	for (let i = 0; i < placeholderCount; i++) {
		items.push({
			type: 'CHAT_MEMBER_PLACEHOLDER',
			key: `chat-member-placeholder-${i}`,
		});
	}

	function renderItem({ item }: { item: Item }) {
		switch (item.type) {
			case 'MEMBERS_AND_REQUESTS':
				return (
					<MembersAndRequests
						convo={convo}
						requestCount={requestCount}
						hasMoreRequests={!!hasMoreRequests}
						isOwner={isOwner}
					/>
				);
			case 'ADD_MEMBERS_LINK':
				return <AddMembersLink convo={convo} />;
			case 'CHAT_MEMBER':
				return <Member convo={convo} profile={item.profile} status={item.status} isOwner={isOwner} />;
			case 'CHAT_MEMBER_PLACEHOLDER':
				return <MemberPlaceholder />;
			default:
				return null;
		}
	}

	const onRefresh = async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh group chat members', { message: err });
		}
		setIsPTRing(false);
	};

	return (
		<List
			data={items}
			contentContainerStyle={{
				paddingBottom: bottomBarOffset + a.pb_xl.paddingBottom,
			}}
			desktopFixedHeight
			initialNumToRender={initialNumToRender}
			keyExtractor={keyExtractor}
			ListHeaderComponent={<SettingsHeader convo={convo} isOwner={isOwner} moderationOpts={moderationOpts} />}
			renderItem={renderItem}
			sideBorders={false}
			windowSize={11}
			refreshing={isPTRing}
			onRefresh={() => void onRefresh()}
		/>
	);
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
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();

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
			navigation.replace('Messages', { animation: 'pop' });
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

	const inviteLinkDialog = useDialogControl();
	const editNamePrompt = Prompt.usePromptControl();
	const lockChatPrompt = Prompt.usePromptControl();
	const leaveChatPrompt = Prompt.usePromptControl();
	const leaveAndLockChatPrompt = Prompt.usePromptControl();
	const reportHandle = Dialog.useDialogHandle();
	const deleteControl = Prompt.usePromptControl();

	const handleToggleMute = () => {
		muteConvo({ mute: !convo.view.muted });
	};

	const handlePromptName = () => {
		setNewGroupName(groupName);
		setEditNameInputKey((k) => k + 1);
		editNamePrompt.open();
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
			<View style={[a.px_xl, a.py_4xl, a.border_b, t.atoms.border_contrast_low]}>
				<View style={[a.align_center, a.justify_center]}>
					<AvatarBubbles profiles={convo.members} />
				</View>
				<Text style={[a.text_2xl, a.font_bold, a.text_center, a.pt_lg, t.atoms.text]}>{groupName}</Text>
				<Text style={[a.text_sm, a.text_center, a.pt_xs, a.px_xl, t.atoms.text_contrast_high]}>
					{m['screens.messages.inviteLink.created']({
						date: createdAt,
					})}
				</Text>
				<View style={[a.flex_row, a.align_center, a.justify_center, a.gap_2xl, a.pt_2xl, a.flex_wrap]}>
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
						onPress={handleToggleMute}
					/>
					{isOwner ? (
						<SettingsButton
							disabled={isEditingName || lockStatus !== 'unlocked'}
							icon={EditIcon}
							label={m['screens.messages.groupName.edit.a11y']()}
							text={m['screens.messages.groupName.edit.short']()}
							onPress={handlePromptName}
						/>
					) : null}
					{isJoinLinkEnabled ? (
						<SettingsButton
							disabled={lockStatus !== 'unlocked'}
							icon={ChainLinkIcon}
							label={
								isOwner
									? m['screens.messages.inviteLink.manage.label']()
									: m['screens.messages.inviteLink.view.hint']()
							}
							text={m['screens.messages.inviteLink.label']()}
							onPress={inviteLinkDialog.open}
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
							onPress={lockStatus === 'locked' ? handleUnlock : lockChatPrompt.open}
						/>
					) : null}
					{!isOwner && reportSubjectDid ? (
						<SettingsButton
							icon={FlagIcon}
							label={m['screens.messages.report.group']()}
							text={m['common.action.report']()}
							onPress={() => reportHandle.open(null)}
						/>
					) : null}
					<SettingsButton
						disabled={isLeaving || (isOwner && isLocking)}
						icon={ArrowBoxLeftIcon}
						label={m['screens.messages.leave.a11y']()}
						text={m['common.action.leave']()}
						onPress={isOwner ? leaveAndLockChatPrompt.open : leaveChatPrompt.open}
					/>
				</View>
			</View>
			<EditNamePrompt
				control={editNamePrompt}
				value={newGroupName}
				inputKey={editNameInputKey}
				onChangeText={setNewGroupName}
				onConfirm={handleEditName}
			/>
			{convo.primaryMember && (
				<InviteLinkDialog
					convo={convo}
					owner={convo.primaryMember}
					control={inviteLinkDialog}
					isOwner={isOwner}
					moderationOpts={moderationOpts}
				/>
			)}
			<LockChatPrompt control={lockChatPrompt} onConfirm={handleConfirmLock} />
			<LeaveChatPrompt control={leaveChatPrompt} groupName={groupName} onConfirm={leaveConvo} />
			<LeaveAndLockChatPrompt
				control={leaveAndLockChatPrompt}
				groupName={groupName}
				onConfirm={() => void leaveAndLockConvo()}
			/>
			{reportSubjectDid ? (
				<>
					<ReportConversationDialog
						handle={reportHandle}
						convoId={convo.view.id}
						did={reportSubjectDid}
						onAfterSubmit={deleteControl.open}
					/>
					<AfterReportConversationDialog
						control={deleteControl}
						currentScreen="conversation"
						params={{ convoId: convo.view.id, did: reportSubjectDid }}
					/>
				</>
			) : null}
		</>
	);
}

function SettingsButton({
	color = 'secondary',
	disabled,
	icon,
	label,
	text,
	onPress,
}: {
	color?: ButtonColor;
	disabled?: boolean;
	icon: React.ComponentType<SVGIconProps>;
	label: string;
	text: string;
	onPress: () => void;
}) {
	const t = useTheme();

	return (
		<View style={[a.align_center]}>
			<Button
				color={color}
				disabled={disabled}
				size="large"
				shape="round"
				label={label}
				onPress={onPress}
				style={[
					{
						width: 48,
						height: 48,
					},
				]}
			>
				<ButtonIcon icon={icon} size="md" />
			</Button>
			<Text numberOfLines={1} style={[a.text_xs, a.font_medium, a.text_center, a.pt_xs, t.atoms.text]}>
				{text}
			</Text>
		</View>
	);
}
