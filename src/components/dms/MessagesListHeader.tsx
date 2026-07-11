import { View } from 'react-native';

import {
	type BlockingModerationCause,
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	ModerationCauseType,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { makeProfileLink } from '#/lib/routes/links';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { atoms as a, useTheme } from '#/alf';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { ButtonIcon } from '#/components/Button';
import { ConvoMenu } from '#/components/dms/ConvoMenu';
import { Bell2Off_Filled_Corner0_Rounded as BellOffIcon } from '#/components/icons/Bell2';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon } from '#/components/icons/DotGrid';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Typography';
import { PreviewableUserAvatar } from '#/components/UserAvatar';
import { Button as WebButton, ButtonIcon as WebButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import type { ConvoWithDetails } from './util';

const PFP_SIZE = 40;

export function MessagesListHeader({ convo }: { convo?: ConvoWithDetails | null }) {
	const t = useTheme();
	const moderationOpts = useModerationOpts();
	const { isWithinSplitView } = useIsWithinSplitView();

	return (
		<Layout.Header.Outer noBottomBorder={false}>
			<View style={[a.w_full, a.flex_row, a.gap_xs, a.align_start]}>
				{!isWithinSplitView && (
					<View style={[{ minHeight: PFP_SIZE }, a.justify_center]}>
						<Layout.Header.BackButton />
					</View>
				)}
				{convo && moderationOpts ? (
					convo.kind === 'direct' ? (
						<ProfileHeaderReady convo={convo} moderationOpts={moderationOpts} />
					) : (
						<GroupHeaderReady convo={convo} />
					)
				) : (
					<>
						<View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
							<View style={[{ width: PFP_SIZE, height: PFP_SIZE }, a.rounded_full, t.atoms.bg_contrast_25]} />
							<View style={a.gap_xs}>
								<View style={[{ width: 150, height: 16 }, a.rounded_xs, t.atoms.bg_contrast_25, a.mt_xs]} />
							</View>
						</View>

						<Layout.Header.Slot />
					</>
				)}
			</View>
		</Layout.Header.Outer>
	);
}

function ProfileHeaderReady({
	convo,
	moderationOpts,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'direct' }>;
	moderationOpts: ModerationOptions;
}) {
	const t = useTheme();
	const profile = useProfileShadow(convo.primaryMember);

	const moderation = moderateProfile(profile, moderationOpts);

	const blocks = moderation.causes.filter(
		(cause): cause is BlockingModerationCause => cause.type === ModerationCauseType.Blocking,
	);
	const blockInfo = {
		listBlocks: blocks.filter((block) => block.source !== null),
		userBlock: blocks.find((block) => block.source === null),
	};

	const isDeletedAccount = profile?.handle === 'missing.invalid';
	const displayName = isDeletedAccount
		? m['common.account.deleted']()
		: createSanitizedDisplayName(
				profile,
				true,
				getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
			);
	const handle = isDeletedAccount ? null : `@${profile.handle}`;

	return (
		<Wrapper
			heading={
				<Link
					label={m['common.profile.a11y.viewDisplayName']({ name: displayName })}
					style={[a.flex_row, a.gap_md, a.flex_1]}
					to={makeProfileLink(profile)}
				>
					<PreviewableUserAvatar
						size={PFP_SIZE}
						profile={profile}
						moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
						disableHoverCard={moderation.causes.some(
							(c) => c.type === ModerationCauseType.Blocking || c.type === ModerationCauseType.BlockedBy,
						)}
					/>
					<View style={[a.flex_1]}>
						<View style={[a.flex_row, a.align_center, a.flex_1, a.mb_2xs]}>
							<Text style={[a.text_lg, a.font_semi_bold, a.flex_shrink]} numberOfLines={1}>
								{displayName}
							</Text>
							<View style={[a.pl_xs]}>
								<ProfileBadges profile={profile} size="md" />
							</View>
							<MuteStatus muted={convo.view.muted} />
						</View>
						{handle ? (
							<Text style={[a.text_xs, t.atoms.text_contrast_high]} numberOfLines={1}>
								{handle}
							</Text>
						) : null}
					</View>
				</Link>
			}
			settings={
				<ConvoMenu
					blockInfo={blockInfo}
					convo={convo}
					currentScreen="conversation"
					profile={profile}
					render={
						<WebButton
							label={m['common.chat.settingsLabel']()}
							size="small"
							color="secondary"
							shape="round"
							variant="ghost"
						>
							<WebButtonIcon icon={DotsHorizontalIcon} size="md" />
						</WebButton>
					}
				/>
			}
		/>
	);
}

function GroupHeaderReady({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const disabled = convo.details.lockStatus === 'locked-permanently';

	return (
		<Wrapper
			heading={
				<Link
					label={convo.details.name}
					accessibilityHint={m['components.dms.group.action.openSettings']()}
					style={[a.flex_row, a.gap_md, a.flex_1, a.justify_start]}
					to={
						disabled
							? '#'
							: {
									screen: 'MessagesConversationSettings',
									params: {
										conversation: convo.view.id,
									},
								}
					}
				>
					<AvatarBubbles size={40} profiles={convo.members} />
					<View style={[a.flex_row, a.flex_1, a.align_center]}>
						<Text style={[a.text_lg, a.font_semi_bold, a.flex_shrink]} numberOfLines={1}>
							{convo.details.name}
						</Text>
						<MuteStatus muted={convo.view.muted} />
					</View>
				</Link>
			}
			settings={
				<Link
					to={
						disabled
							? '#'
							: {
									screen: 'MessagesConversationSettings',
									params: {
										conversation: convo.view.id,
									},
								}
					}
					label={m['components.dms.group.action.openSettings']()}
					size="small"
					color="secondary"
					shape="round"
					variant="ghost"
					style={[a.bg_transparent, a.justify_center]}
				>
					<ButtonIcon icon={DotsHorizontalIcon} size="md" />
				</Link>
			}
		/>
	);
}

function Wrapper({ heading, settings }: { heading: React.ReactNode; settings: React.ReactNode }) {
	return (
		<View style={[a.flex_1]}>
			<View style={[a.w_full, a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
				<View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>{heading}</View>

				<View style={[{ minHeight: PFP_SIZE }, a.justify_center, a.flex_shrink_0]}>
					<Layout.Header.Slot>{settings}</Layout.Header.Slot>
				</View>
			</View>
		</View>
	);
}

function MuteStatus({ muted }: { muted: boolean }) {
	const t = useTheme();

	return muted ? (
		<>
			<Text style={[a.text_md, t.atoms.text_contrast_medium]}> &middot; </Text>
			<BellOffIcon size="sm" style={t.atoms.text_contrast_medium} />
		</>
	) : undefined;
}
