import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { useMaybeProfileShadow, useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { UserAvatar } from '#/components/UserAvatar';
import { KnownFollowers } from '#/components/web/KnownFollowers';

import { useActorStatus } from '#/features/liveNow/use-actor-status';
import { m } from '#/paraglide/messages';

import * as ChatRow from './ChatRow';
import * as css from './ChatRow.css';
import { getLastMessagePreview, isBlockedAccount, isDimmed, usePrecacheConvo } from './ChatRowData';
import { AcceptChatButton, DeleteChatButton, RejectMenu } from './RequestButtons';
import { useIsWithinSplitView } from './splitView/context';

/** a pending conversation request, dispatching to the variant for its kind. */
export function RequestListItem({ convo: convoView }: { convo: ChatBskyConvoDefs.ConvoView }) {
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	if (!moderationOpts) {
		return null;
	}

	const convo = parseConvoView(convoView, currentAccount?.did);

	switch (convo?.kind) {
		case 'direct': {
			return <DirectRequestItem convo={convo} moderationOpts={moderationOpts} />;
		}
		case 'group': {
			return <GroupRequestItem convo={convo} moderationOpts={moderationOpts} />;
		}
		default: {
			return null;
		}
	}
}

/** a request from a single user, showing who else follows them so the user can judge it. */
function DirectRequestItem({
	convo,
	moderationOpts,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'direct' }>;
	moderationOpts: ModerationOptions;
}) {
	const { currentAccount } = useSession();
	const { isWithinLeftPanel } = useIsWithinSplitView();
	const profile = useProfileShadow(convo.primaryMember);
	const status = useActorStatus(profile);
	const precache = usePrecacheConvo(convo);

	const moderation = moderateProfile(profile, moderationOpts);
	const blocked = isBlockedAccount(moderation);
	const isDeletedAccount = profile.handle === 'missing.invalid';

	const dim = isDimmed(convo, { blocked, isDeletedAccount });
	const preview = getLastMessagePreview({
		convo,
		currentAccountDid: currentAccount?.did,
		isDeletedAccount,
		primaryProfile: profile,
	});

	const title = isDeletedAccount ? m['common.account.deleted']() : profile.handle;

	return (
		<ChatRow.Root tone="default">
			<ChatRow.Link
				action={isWithinLeftPanel ? 'navigate' : 'push'}
				hint={
					isDeletedAccount
						? m['screens.messages.deletedAccount.message']()
						: m['screens.messages.chats.goToConversation']({ handle: profile.handle })
				}
				label={title}
				onPointerDown={precache}
				onPress={precache}
				to={`/messages/${convo.view.id}`}
			/>

			<ChatRow.Body>
				<UserAvatar
					avatar={profile.avatar}
					live={status.isActive}
					moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
					size={40}
					type={profile.associated?.labeler ? 'labeler' : 'user'}
				/>

				<ChatRow.Content>
					<ChatRow.TitleRow>
						<ChatRow.Title dim={dim}>{title}</ChatRow.Title>
						<ChatRow.Badges profile={profile} />
						{preview.sentAt && <ChatRow.Timestamp sentAt={preview.sentAt} />}
						{(convo.view.muted || blocked) && <ChatRow.MutedIcon />}
					</ChatRow.TitleRow>

					<PostAlerts
						className={css.postAlerts}
						modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
						size="sm"
					/>

					<ChatRow.LastMessage dim={dim} icon={preview.Icon} unread={false}>
						{preview.text}
					</ChatRow.LastMessage>

					<KnownFollowers moderationOpts={moderationOpts} profile={profile} showIfEmpty variant="compact" />
				</ChatRow.Content>
			</ChatRow.Body>

			<ChatRow.Footer>
				{isDeletedAccount ? (
					<DeleteChatButton convo={convo.view} currentScreen="list" />
				) : (
					<>
						<AcceptChatButton convo={convo.view} currentScreen="list" />
						<RejectMenu convo={convo} currentScreen="list" profile={profile} showDeleteConvo />
					</>
				)}
			</ChatRow.Footer>
		</ChatRow.Root>
	);
}

/** an invitation to a group chat. a locked group can only be rejected, never accepted. */
function GroupRequestItem({
	convo,
	moderationOpts,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	moderationOpts: ModerationOptions;
}) {
	const { currentAccount } = useSession();
	const { isWithinLeftPanel } = useIsWithinSplitView();
	const owner = useMaybeProfileShadow(convo.primaryMember);
	const precache = usePrecacheConvo(convo);

	const moderation = owner ? moderateProfile(owner, moderationOpts) : undefined;
	const ownerIsGone = !owner || owner.handle === 'missing.invalid';

	const dim = isDimmed(convo, { blocked: false, isDeletedAccount: ownerIsGone });
	const preview = getLastMessagePreview({
		convo,
		currentAccountDid: currentAccount?.did,
		isDeletedAccount: ownerIsGone,
		primaryProfile: owner,
	});

	const title = convo.details.name;
	const canAccept = convo.details.lockStatus === 'unlocked';

	return (
		<ChatRow.Root tone="default">
			<ChatRow.Link
				action={isWithinLeftPanel ? 'navigate' : 'push'}
				hint={m['screens.messages.chats.goToGroupChat']({ name: title })}
				label={title}
				onPointerDown={precache}
				onPress={precache}
				to={`/messages/${convo.view.id}`}
			/>

			<ChatRow.Body>
				<AvatarBubbles profiles={convo.members} size={40} />

				<ChatRow.Content>
					<ChatRow.TitleRow>
						<ChatRow.Title dim={dim}>{title}</ChatRow.Title>
						{preview.sentAt && <ChatRow.Timestamp sentAt={preview.sentAt} />}
						{convo.view.muted && <ChatRow.MutedIcon />}
					</ChatRow.TitleRow>

					<ChatRow.LastMessage dim={dim} icon={preview.Icon} unread={false}>
						{preview.text}
					</ChatRow.LastMessage>
				</ChatRow.Content>
			</ChatRow.Body>

			<ChatRow.Footer>
				{ownerIsGone || !moderation ? (
					<DeleteChatButton convo={convo.view} currentScreen="list" />
				) : (
					<>
						{canAccept && <AcceptChatButton convo={convo.view} currentScreen="list" />}
						<RejectMenu convo={convo} currentScreen="list" profile={owner} showDeleteConvo />
					</>
				)}
			</ChatRow.Footer>
		</ChatRow.Root>
	);
}
