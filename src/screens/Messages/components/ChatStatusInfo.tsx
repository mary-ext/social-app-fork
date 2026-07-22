import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import type { ActiveConvoStates } from '#/state/messages/convo';
import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { Trans } from '#/locale/Trans';

import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import { KnownFollowers } from '#/components/web/KnownFollowers';

import { m } from '#/paraglide/messages';

import * as styles from './ChatStatusInfo.css';
import { AcceptChatButton, DeleteChatButton, RejectMenu } from './RequestButtons';

export function ChatStatusInfo({ convoState }: { convoState: ActiveConvoStates }) {
	const moderationOpts = useModerationOpts();
	const leaveConvoPromptHandle = Prompt.usePromptHandle();

	const onAcceptChat = () => {
		convoState.markConvoAccepted();
	};

	// either the other person, or the chat owner
	// if we ever allow someone other than the owner to invite people, this will need to change
	const otherUser = convoState.convo.primaryMember;

	if (!moderationOpts) {
		return null;
	}

	return (
		<div className={styles.root}>
			<div className={styles.gradient} />
			{otherUser && <InviterHeader moderationOpts={moderationOpts} profile={otherUser} />}
			{otherUser && (
				<KnownFollowers moderationOpts={moderationOpts} profile={otherUser} showIfEmpty variant="compact" />
			)}
			<div className={clsx(styles.actionRow, otherUser && styles.actionRowTopPad)}>
				{otherUser && (
					<RejectMenu
						className={styles.grow}
						color="negative_subtle"
						convo={convoState.convo}
						currentScreen="conversation"
						icon={true}
						label={m['screens.messages.block.orReport']()}
						profile={otherUser}
						size="large"
					/>
				)}
				<DeleteChatButton
					className={styles.grow}
					color="secondary"
					convo={convoState.convo.view}
					currentScreen="conversation"
					icon={true}
					label={m['common.action.leave']()}
					onClick={() => leaveConvoPromptHandle.open(null)}
					size="large"
				/>
				<LeaveConvoPrompt
					convoId={convoState.convo.view.id}
					currentScreen="conversation"
					handle={leaveConvoPromptHandle}
					hasMessages={false}
				/>
			</div>
			<div className={styles.acceptRow}>
				<AcceptChatButton
					className={styles.grow}
					color="primary"
					convo={convoState.convo.view}
					currentScreen="conversation"
					icon={true}
					onAcceptConvo={onAcceptChat}
					size="large"
				/>
			</div>
		</div>
	);
}

function InviterHeader({
	profile: profileUnshadowed,
	moderationOpts,
}: {
	profile: AnyProfileView;
	moderationOpts: NonNullable<ReturnType<typeof useModerationOpts>>;
}) {
	const profile = useProfileShadow(profileUnshadowed);
	const moderation = moderateProfile(profile, moderationOpts);
	const displayName = createSanitizedDisplayName(
		profile,
		true,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<div className={styles.inviterRow}>
			<PreviewableUserAvatar
				moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
				profile={profile}
				size={42}
			/>
			<div className={styles.inviterColumn}>
				<Text className={styles.inviterName}>
					<Trans
						inputs={{ name: displayName }}
						markup={{
							t0: ({ children }) => (
								<Text color="text" numberOfLines={1} size="md" weight="semiBold">
									{children}
								</Text>
							),
							t1: ({ children }) => <span className={styles.badgePad}>{children}</span>,
							t2: () => <ProfileBadges profile={profile} size="sm" />,
							t3: ({ children }) => (
								<Text color="text" numberOfLines={1} size="md" weight="semiBold">
									{children}
								</Text>
							),
						}}
						message={m['screens.messages.addedToChat.addedYou']}
					/>
				</Text>
				<Text className={styles.handle} color="textContrastHigh" size="sm">{`@${profile.handle}`}</Text>
			</div>
		</div>
	);
}
