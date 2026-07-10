import { useId } from 'react';

import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { useMaybeProfileShadow, useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { JOIN_REQUESTS_THRESHOLD } from '#/state/queries/messages/list-join-requests';
import { useSession } from '#/state/session';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { ConvoMenu } from '#/components/dms/ConvoMenu';
import { type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import * as Menu from '#/components/Menu';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { UserAvatar } from '#/components/UserAvatar';

import { useActorStatus } from '#/features/liveNow';
import { m } from '#/paraglide/messages';

import * as ChatRow from './ChatRow';
import * as css from './ChatRow.css';
import {
	getBlockInfo,
	getLastMessagePreview,
	hasUnread,
	isBlockedAccount,
	isDimmed,
	usePrecacheConvo,
} from './ChatRowData';
import { useIsWithinSplitView } from './splitView/context';

/** a conversation row in the chat list, dispatching to the variant for its kind. */
export function ChatListItem({
	convo: convoView,
	selected = false,
}: {
	convo: ChatBskyConvoDefs.ConvoView;
	selected?: boolean;
}) {
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	if (!moderationOpts) {
		return null;
	}

	const convo = parseConvoView(convoView, currentAccount?.did);

	switch (convo?.kind) {
		case 'direct': {
			return <DirectChatItem convo={convo} moderationOpts={moderationOpts} selected={selected} />;
		}
		case 'group': {
			return <GroupChatItem convo={convo} moderationOpts={moderationOpts} selected={selected} />;
		}
		default: {
			return null;
		}
	}
}

/** a one-to-one conversation: the other party's avatar, name, handle, and moderation state. */
function DirectChatItem({
	convo,
	moderationOpts,
	selected,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'direct' }>;
	moderationOpts: ModerationOptions;
	selected: boolean;
}) {
	const { currentAccount } = useSession();
	const { isWithinLeftPanel } = useIsWithinSplitView();
	const profile = useProfileShadow(convo.primaryMember);
	const status = useActorStatus(profile);
	const precache = usePrecacheConvo(convo);

	const menuHandle = Menu.useMenuHandle();
	const menuTriggerId = useId();

	const moderation = moderateProfile(profile, moderationOpts);
	const blocked = isBlockedAccount(moderation);
	const isDeletedAccount = profile.handle === 'missing.invalid';

	const unread = hasUnread(convo, { isDeletedAccount, selected });
	const dim = isDimmed(convo, { blocked, isDeletedAccount });
	const preview = getLastMessagePreview({
		convo,
		currentAccountDid: currentAccount?.did,
		isDeletedAccount,
		primaryProfile: profile,
	});

	const title = isDeletedAccount ? m['common.account.deleted']() : profile.handle;

	// a deleted account has nowhere to navigate to, so the row opens its menu instead
	const onPress = () => {
		precache();
		if (isDeletedAccount) {
			menuHandle.open(menuTriggerId);
			return false;
		}
	};

	return (
		<ChatRow.Root tone={selected ? 'selected' : unread ? 'unread' : 'default'}>
			<ChatRow.Link
				action={isWithinLeftPanel ? 'navigate' : 'push'}
				hint={
					isDeletedAccount
						? m['screens.messages.deletedAccount.message']()
						: m['screens.messages.chats.goToConversation']({ handle: profile.handle })
				}
				label={title}
				onPointerDown={precache}
				onPress={onPress}
				to={`/messages/${convo.view.id}`}
			/>

			<ChatRow.Body>
				<UserAvatar
					avatar={profile.avatar}
					live={status.isActive}
					moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
					size={48}
					type={profile.associated?.labeler ? 'labeler' : 'user'}
				/>

				<ChatRow.Content>
					<ChatRow.TitleRow>
						<ChatRow.Title dim={dim}>{title}</ChatRow.Title>
						<ChatRow.Badges profile={profile} />

						{preview.sentAt && <ChatRow.Timestamp sentAt={preview.sentAt} />}
						{(convo.view.muted || blocked) && <ChatRow.MutedIcon />}
						{unread && <ChatRow.UnreadDot dim={dim} />}
					</ChatRow.TitleRow>

					{!isWithinLeftPanel && (
						<PostAlerts
							className={css.postAlerts}
							modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
							size="sm"
						/>
					)}

					<ChatRow.LastMessage dim={dim} icon={preview.Icon} unread={unread}>
						{preview.text}
					</ChatRow.LastMessage>
				</ChatRow.Content>
			</ChatRow.Body>

			<ChatRow.Menu>
				<ConvoMenu
					blockInfo={getBlockInfo(moderation)}
					convo={convo}
					currentScreen="list"
					handle={menuHandle}
					profile={profile}
					showMarkAsRead={convo.view.unreadCount > 0}
					triggerId={menuTriggerId}
				/>
			</ChatRow.Menu>
		</ChatRow.Root>
	);
}

/** a group conversation: stacked member avatars, the group's name, and its pending join requests. */
function GroupChatItem({
	convo,
	moderationOpts,
	selected,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	moderationOpts: ModerationOptions;
	selected: boolean;
}) {
	const { currentAccount } = useSession();
	const { isWithinLeftPanel } = useIsWithinSplitView();
	const owner = useMaybeProfileShadow(convo.primaryMember);
	const precache = usePrecacheConvo(convo);

	const menuHandle = Menu.useMenuHandle();
	const menuTriggerId = useId();

	const moderation = owner ? moderateProfile(owner, moderationOpts) : undefined;

	const unread = hasUnread(convo, { isDeletedAccount: false, selected });
	const dim = isDimmed(convo, { blocked: false, isDeletedAccount: false });
	const preview = getLastMessagePreview({
		convo,
		currentAccountDid: currentAccount?.did,
		isDeletedAccount: false,
		primaryProfile: owner,
	});

	const title = convo.details.name;
	const joinRequests = convo.details.unreadJoinRequestCount ?? 0;

	return (
		<ChatRow.Root tone={selected ? 'selected' : unread ? 'unread' : 'default'}>
			<ChatRow.Link
				action={isWithinLeftPanel ? 'navigate' : 'push'}
				hint={m['screens.messages.chats.goToGroupChat']({ name: title })}
				label={title}
				onPointerDown={precache}
				onPress={precache}
				to={`/messages/${convo.view.id}`}
			/>

			<ChatRow.Body>
				<AvatarBubbles profiles={convo.members} size={48} />

				<ChatRow.Content>
					<ChatRow.TitleRow>
						<ChatRow.Title dim={dim}>{title}</ChatRow.Title>
						{preview.sentAt && <ChatRow.Timestamp sentAt={preview.sentAt} />}
						{convo.view.muted && <ChatRow.MutedIcon />}
						{unread && <ChatRow.UnreadDot dim={dim} />}
					</ChatRow.TitleRow>

					{joinRequests > 0 && (
						<ChatRow.RequestInfo dim={dim} unread={unread}>
							{joinRequests > JOIN_REQUESTS_THRESHOLD
								? m['screens.messages.requests.newOverThreshold']({ count: JOIN_REQUESTS_THRESHOLD })
								: m['screens.messages.requests.newCount']({ count: joinRequests })}
						</ChatRow.RequestInfo>
					)}

					<ChatRow.LastMessage dim={dim} icon={preview.Icon} unread={unread}>
						{preview.text}
					</ChatRow.LastMessage>
				</ChatRow.Content>
			</ChatRow.Body>

			{/* TODO: Allow showing menu for groups where the owner has left! */}
			{owner && (
				<ChatRow.Menu>
					<ConvoMenu
						blockInfo={getBlockInfo(moderation)}
						convo={convo}
						currentScreen="list"
						handle={menuHandle}
						profile={owner}
						showMarkAsRead={convo.view.unreadCount > 0}
						triggerId={menuTriggerId}
					/>
				</ChatRow.Menu>
			)}
		</ChatRow.Root>
	);
}
