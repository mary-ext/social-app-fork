import { memo, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationDecision,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { type Shadow, useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileBlockMutationQueue, useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useRequireAuth, useSession } from '#/state/session';

import { logger } from '#/logger';

import { ProfileMenu } from '#/view/com/profile/ProfileMenu';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { SubscribeProfileButton } from '#/components/activity-notifications/SubscribeProfileButton';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { MessageProfileButton } from '#/components/dms/MessageProfileButton';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { KnownFollowers, shouldShowKnownFollowers } from '#/components/KnownFollowers';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { Button as WebButton, ButtonText as WebButtonText } from '#/components/web/Button';
import * as Sheet from '#/components/web/Sheet';

import { useActorStatus } from '#/features/liveNow';

import { GermButton } from '../components/GermButton';
import { EditProfileDialog } from './EditProfileDialog';
import { ProfileHeaderHandle } from './Handle';
import { ProfileHeaderMetrics } from './Metrics';
import { ProfileHeaderShell } from './Shell';
import { ProfileHeaderSuggestedFollows } from './SuggestedFollows';

interface Props {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	descriptionRT: Richtext | null;
	moderationOpts: ModerationOptions;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
}

let ProfileHeaderStandard = ({
	profile: profileUnshadowed,
	descriptionRT,
	moderationOpts,
	hideBackButton = false,
	isPlaceholderProfile,
}: Props): React.ReactNode => {
	const t = useTheme();
	const { gtMobile } = useBreakpoints();
	const profile = useProfileShadow<AppBskyActorDefs.ProfileViewDetailed>(profileUnshadowed);
	const { currentAccount } = useSession();
	const { t: l } = useLingui();
	const moderation = useMemo(() => moderateProfile(profile, moderationOpts), [profile, moderationOpts]);
	const [, queueUnblock] = useProfileBlockMutationQueue(profile);
	const unblockPromptControl = Prompt.usePromptControl();
	const [showSuggestedFollows, setShowSuggestedFollows] = useState(false);
	const [hasSeenAllSuggestedFollows, setHasSeenAllSuggestedFollows] = useState(false);
	const isBlockedUser =
		profile.viewer?.blocking || profile.viewer?.blockedBy || profile.viewer?.blockingByList;

	const unblockAccount = async () => {
		try {
			await queueUnblock();
			Toast.show(l({ message: 'Account unblocked', context: 'toast' }));
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to unblock account', { message: e });
				Toast.show(l`There was an issue! ${e.toString()}`, { type: 'error' });
			}
		}
	};

	const onRequestHide = () => {
		setHasSeenAllSuggestedFollows(true);
		setShowSuggestedFollows(false);
	};

	const isMe = currentAccount?.did === profile.did;

	const { isActive: live } = useActorStatus(profile);

	return (
		<>
			<ProfileHeaderShell
				profile={profile}
				moderation={moderation}
				hideBackButton={hideBackButton}
				isPlaceholderProfile={isPlaceholderProfile}
			>
				<View style={[a.px_lg, a.pt_md, a.pb_sm, a.overflow_hidden]} pointerEvents={'box-none'}>
					<View
						style={[
							{ paddingLeft: 90 },
							a.flex_row,
							a.align_center,
							a.justify_end,
							a.gap_xs,
							a.pb_sm,
							a.flex_wrap,
						]}
						pointerEvents={'box-none'}
					>
						<HeaderStandardButtons
							profile={profile}
							moderation={moderation}
							moderationOpts={moderationOpts}
							onFollow={() => setShowSuggestedFollows(true)}
							onUnfollow={() => setShowSuggestedFollows(false)}
						/>
					</View>
					<View style={[a.flex_col, a.gap_xs, a.pb_sm, live ? a.pt_sm : a.pt_2xs]}>
						<View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
							<Text
								emoji
								testID="profileHeaderDisplayName"
								style={[
									t.atoms.text,
									gtMobile ? a.text_4xl : a.text_3xl,
									a.self_start,
									a.font_bold,
									a.leading_tight,
								]}
							>
								{sanitizeDisplayName(
									profile.displayName || sanitizeHandle(profile.handle),
									getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
								)}
								<View style={[a.pl_xs, { marginTop: undefined }]}>
									<ProfileBadges profile={profile} size="lg" interactive />
								</View>
							</Text>
						</View>
						<ProfileHeaderHandle profile={profile} />
					</View>
					{!isPlaceholderProfile && !isBlockedUser && (
						<View style={a.gap_md}>
							<ProfileHeaderMetrics profile={profile} />
							{descriptionRT &&
							getDisplayRestrictions(moderation, DisplayContext.ProfileView).blurs.length === 0 ? (
								<View pointerEvents="auto">
									<RichText
										testID="profileHeaderDescription"
										style={[a.text_md]}
										numberOfLines={15}
										selectable
										value={descriptionRT}
										enableTags
										authorHandle={profile.handle}
									/>
								</View>
							) : undefined}

							{profile.associated?.germ && <GermButton germ={profile.associated.germ} profile={profile} />}

							{!isMe && !isBlockedUser && shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
								<View style={[a.flex_row, a.align_center, a.gap_sm]}>
									<KnownFollowers profile={profile} moderationOpts={moderationOpts} />
								</View>
							)}
						</View>
					)}

					<DebugFieldDisplay subject={profile} />
				</View>

				<Prompt.Basic
					control={unblockPromptControl}
					title={l`Unblock Account?`}
					description={l`The account will be able to interact with you after unblocking.`}
					onConfirm={() => {
						void unblockAccount();
					}}
					confirmButtonCta={profile.viewer?.blocking ? l`Unblock` : l`Block`}
					confirmButtonColor="negative"
				/>
			</ProfileHeaderShell>
			<ProfileHeaderSuggestedFollows
				isExpanded={!hasSeenAllSuggestedFollows && showSuggestedFollows}
				actorDid={profile.did}
				onRequestHide={onRequestHide}
			/>
		</>
	);
};

ProfileHeaderStandard = memo(ProfileHeaderStandard);
export { ProfileHeaderStandard };

export function HeaderStandardButtons({
	profile,
	moderation,
	moderationOpts,
	onFollow,
	onUnfollow,
	minimal,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	moderation: ModerationDecision;
	moderationOpts: ModerationOptions;
	onFollow?: () => void;
	onUnfollow?: () => void;
	minimal?: boolean;
}) {
	const { t: l } = useLingui();
	const { hasSession, currentAccount } = useSession();
	const requireAuth = useRequireAuth();
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile, 'ProfileHeader');
	const [, queueUnblock] = useProfileBlockMutationQueue(profile);
	const editProfileHandle = Sheet.useSheetHandle();
	const unblockPromptControl = Prompt.usePromptControl();

	const isMe = currentAccount?.did === profile.did;

	const onPressFollow = () => {
		requireAuth(async () => {
			try {
				await queueFollow();
				onFollow?.();
				Toast.show(
					l`Following ${sanitizeDisplayName(
						profile.displayName || profile.handle,
						getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
					)}`,
				);
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to follow', { message: String(e) });
					Toast.show(l`There was an issue! ${e.toString()}`, {
						type: 'error',
					});
				}
			}
		});
	};

	const onPressUnfollow = () => {
		requireAuth(async () => {
			try {
				await queueUnfollow();
				onUnfollow?.();
				Toast.show(
					l`No longer following ${sanitizeDisplayName(
						profile.displayName || profile.handle,
						getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
					)}`,
					{ type: 'default' },
				);
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to unfollow', { message: String(e) });
					Toast.show(l`There was an issue! ${e.toString()}`, {
						type: 'error',
					});
				}
			}
		});
	};

	const unblockAccount = async () => {
		try {
			await queueUnblock();
			Toast.show(l({ message: 'Account unblocked', context: 'toast' }));
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to unblock account', { message: e });
				Toast.show(l`There was an issue! ${e.toString()}`, { type: 'error' });
			}
		}
	};

	const subscriptionsAllowed = useMemo(() => {
		switch (profile.associated?.activitySubscription?.allowSubscriptions) {
			case 'followers':
			case undefined:
				return !!profile.viewer?.following;
			case 'mutuals':
				return !!profile.viewer?.following && !!profile.viewer.followedBy;
			case 'none':
			default:
				return false;
		}
	}, [profile]);

	return (
		<>
			{isMe ? (
				<>
					<Sheet.Trigger
						handle={editProfileHandle}
						render={<WebButton label={l`Edit profile`} color="secondary" size="small" />}
					>
						<WebButtonText>
							<Trans>Edit Profile</Trans>
						</WebButtonText>
					</Sheet.Trigger>
					<EditProfileDialog profile={profile} handle={editProfileHandle} />
				</>
			) : profile.viewer?.blocking ? (
				profile.viewer?.blockingByList ? null : (
					<Button
						testID="unblockBtn"
						size="small"
						color="secondary"
						label={l`Unblock`}
						disabled={!hasSession}
						onPress={() => unblockPromptControl.open()}
					>
						<ButtonText>
							<Trans context="action">Unblock</Trans>
						</ButtonText>
					</Button>
				)
			) : !profile.viewer?.blockedBy ? (
				<>
					{hasSession && (!minimal || profile.viewer?.following) && (
						<>
							{subscriptionsAllowed && (
								<SubscribeProfileButton
									profile={profile}
									moderationOpts={moderationOpts}
									disableHint={minimal}
								/>
							)}

							<MessageProfileButton profile={profile} />
						</>
					)}

					{(!minimal || !profile.viewer?.following) && (
						<Button
							testID={profile.viewer?.following ? 'unfollowBtn' : 'followBtn'}
							size="small"
							color={profile.viewer?.following ? 'secondary' : 'primary'}
							label={profile.viewer?.following ? l`Unfollow ${profile.handle}` : l`Follow ${profile.handle}`}
							onPress={profile.viewer?.following ? onPressUnfollow : onPressFollow}
						>
							{!profile.viewer?.following && <ButtonIcon icon={Plus} />}
							<ButtonText>
								{profile.viewer?.following ? (
									<Trans>Following</Trans>
								) : profile.viewer?.followedBy ? (
									<Trans>Follow back</Trans>
								) : (
									<Trans>Follow</Trans>
								)}
							</ButtonText>
						</Button>
					)}
				</>
			) : null}
			<ProfileMenu profile={profile} />
			<Prompt.Basic
				control={unblockPromptControl}
				title={l`Unblock Account?`}
				description={l`The account will be able to interact with you after unblocking.`}
				onConfirm={() => {
					void unblockAccount();
				}}
				confirmButtonCta={l`Unblock`}
				confirmButtonColor="negative"
			/>
		</>
	);
}
