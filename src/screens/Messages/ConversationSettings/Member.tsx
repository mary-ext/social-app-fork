import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useRemoveFromGroupChat } from '#/state/queries/messages/remove-from-group';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import type { ConvoWithDetails, GroupConvoMember } from '#/components/dms/util';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';

import * as css from './Member.css';
import { MemberMenu } from './MemberMenu';
import { RemoveMemberPrompt } from './prompts';
import { StatusBadge } from './StatusBadge';

export function Member({
	convo,
	profile: profileUnshadowed,
	status,
	isOwner,
}: {
	convo: ConvoWithDetails;
	profile: GroupConvoMember;
	status: 'owner' | 'standard';
	isOwner: boolean;
}) {
	const profile = useProfileShadow(profileUnshadowed);
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	const removeMemberPrompt = Prompt.usePromptHandle();
	const { mutate: removeMembers } = useRemoveFromGroupChat(convo.view.id, {
		onError: (e) => {
			logger.error('Failed to remove group chat member', { message: e });
			Toast.show(m['screens.messages.members.remove.error'](), { type: 'error' });
		},
	});

	if (!moderationOpts) {
		return <MemberPlaceholder />;
	}

	const moderation = moderateProfile(profile, moderationOpts);

	const isDeletedAccount = profile.handle === 'missing.invalid';
	const displayName = isDeletedAccount
		? m['common.account.deleted']()
		: createSanitizedDisplayName(
				profile,
				true,
				getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
			);
	const isProfileOwner = profile.did === convo.primaryMember?.did;
	const isSelf = currentAccount?.did === profile.did;

	const joinedReason = profile.kind?.addedBy
		? m['screens.messages.addedToChat.addedBy']({
				name: createSanitizedDisplayName(
					profile.kind.addedBy,
					true,
					getDisplayRestrictions(
						moderateProfile(profile.kind.addedBy, moderationOpts),
						DisplayContext.ProfileBio,
					),
				),
			})
		: m['screens.messages.addedToChat.addedByInviteLink']();

	// surface a prominent remove button to the owner for blocked members
	const showRemoveButton = isOwner && !isSelf && !!isBlockedOrBlocking(profile);

	return (
		<ProfileCard.Link className={css.memberRow} profile={profile}>
			<ProfileCard.Outer>
				<div className={css.header}>
					<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
					<div className={css.nameColumn}>
						<ProfileCard.Handle profile={profile} />
						<ProfileCard.Name profile={profile} moderationOpts={moderationOpts} />

						{!isProfileOwner && (
							<Text className={css.joinedReason} color="textContrastMedium" numberOfLines={1} size="sm">
								{joinedReason}
							</Text>
						)}
					</div>

					{showRemoveButton && (
						<Prompt.Trigger
							handle={removeMemberPrompt}
							render={
								<Button
									label={m['screens.messages.members.remove.a11y']({ name: displayName })}
									size="tiny"
									color="negative_subtle"
								>
									<ButtonText>{m['common.action.remove']()}</ButtonText>
								</Button>
							}
						/>
					)}

					{status === 'owner' && <StatusBadge label={m['screens.messages.members.admin']()} />}

					{!isSelf && (
						<MemberMenu
							convo={convo}
							profile={profile}
							displayName={displayName}
							type={status}
							isOwner={isOwner}
							render={
								<Button
									className={css.menuButton}
									label={m['screens.messages.members.options.a11y']({ name: displayName })}
									size="small"
									variant="ghost"
									color="secondary"
									shape="round"
								>
									<ButtonIcon icon={EllipsisIcon} size="md" />
								</Button>
							}
						/>
					)}
				</div>
			</ProfileCard.Outer>
			<RemoveMemberPrompt
				handle={removeMemberPrompt}
				displayName={displayName}
				onConfirm={() => removeMembers({ members: [profile.did] })}
			/>
		</ProfileCard.Link>
	);
}

export function MemberPlaceholder() {
	return (
		<div className={css.placeholderRow}>
			<Skeleton.Row align="center" gap="md">
				<ProfileCard.AvatarPlaceholder />
				<ProfileCard.NameAndHandlePlaceholder />
			</Skeleton.Row>
		</div>
	);
}
