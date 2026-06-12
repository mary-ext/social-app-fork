import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import type { ActiveConvoStates } from '#/state/messages/convo';
import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { atoms as a, useTheme } from '#/alf';

import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { KnownFollowers } from '#/components/KnownFollowers';
import { ProfileBadges } from '#/components/ProfileBadges';
import { usePromptControl } from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { PreviewableUserAvatar } from '#/components/UserAvatar';

import { LinearGradient } from '#/shims/linear-gradient';

import { AcceptChatButton, DeleteChatButton, RejectMenu } from './RequestButtons';

export function ChatStatusInfo({ convoState }: { convoState: ActiveConvoStates }) {
	const t = useTheme();
	const { t: l } = useLingui();
	const moderationOpts = useModerationOpts();
	const leaveConvoControl = usePromptControl();

	const onAcceptChat = useCallback(() => {
		convoState.markConvoAccepted();
	}, [convoState]);

	// either the other person, or the chat owner
	// if we ever allow someone other than the owner to invite people, this will need to change
	const otherUser = convoState.convo.primaryMember;

	const lastMessage =
		convoState.convo.view.lastMessage?.$type === 'chat.bsky.convo.defs#messageView'
			? convoState.convo.view.lastMessage
			: null;

	if (!moderationOpts) {
		return null;
	}

	return (
		<View style={[a.gap_md, a.p_2xl, t.atoms.bg]}>
			<LinearGradient
				colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']}
				style={[a.absolute, { top: -16, left: 0, right: 0, height: 16 }]}
				pointerEvents="none"
			/>
			{otherUser && <InviterHeader profile={otherUser} moderationOpts={moderationOpts} />}
			{otherUser && (
				<KnownFollowers profile={otherUser} moderationOpts={moderationOpts} minimal showIfEmpty />
			)}
			<View style={[a.flex_row, a.gap_md, a.w_full, otherUser && a.pt_sm]}>
				{otherUser && (
					<RejectMenu
						label={lastMessage ? l`Block or report` : l`Block`}
						icon={true}
						convo={convoState.convo.view}
						profile={otherUser}
						color="negative_subtle"
						size="large"
						currentScreen="conversation"
						style={[a.flex_1]}
					/>
				)}
				<DeleteChatButton
					label={l({
						message: 'Leave',
						comment: 'Leave a conversation (reject a chat invitation)',
						context: 'Button',
					})}
					icon={true}
					convo={convoState.convo.view}
					color="secondary"
					size="large"
					currentScreen="conversation"
					style={[a.flex_1]}
					onPress={leaveConvoControl.open}
				/>
				<LeaveConvoPrompt
					convoId={convoState.convo.view.id}
					control={leaveConvoControl}
					currentScreen="conversation"
					hasMessages={false}
				/>
			</View>
			<View style={[a.w_full, a.flex_row]}>
				<AcceptChatButton
					icon={true}
					onAcceptConvo={onAcceptChat}
					convo={convoState.convo.view}
					color="primary"
					size="large"
					currentScreen="conversation"
					style={[a.flex_1]}
				/>
			</View>
		</View>
	);
}

function InviterHeader({
	profile: profileUnshadowed,
	moderationOpts,
}: {
	profile: AnyProfileView;
	moderationOpts: NonNullable<ReturnType<typeof useModerationOpts>>;
}) {
	const t = useTheme();
	const profile = useProfileShadow(profileUnshadowed);
	const moderation = useMemo(() => moderateProfile(profile, moderationOpts), [profile, moderationOpts]);
	const displayName = createSanitizedDisplayName(
		profile,
		true,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<View style={[a.flex_row, a.align_center, a.gap_sm]}>
			<PreviewableUserAvatar
				profile={profile}
				size={42}
				moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
			/>
			<View style={[a.flex_1]}>
				<Text style={[a.flex_row, a.align_center]}>
					<Trans comment="Text identifying the person who added you to a group chat">
						<Text style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]} numberOfLines={1}>
							{displayName}
						</Text>
						<View style={[a.pl_xs]}>
							<ProfileBadges profile={profile} size="sm" />
						</View>
						<Text style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]} numberOfLines={1}>
							{' '}
							added you
						</Text>
					</Trans>
				</Text>
				<Text style={[a.pt_xs, a.text_sm, t.atoms.text_contrast_high]}>
					{sanitizeHandle(profile.handle, '@')}
				</Text>
			</View>
		</View>
	);
}
