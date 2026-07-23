import {
	type BlockingModerationCause,
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	ModerationCauseType,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { makeProfileLink } from '#/lib/routes/links';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { ConvoMenu } from '#/components/dms/ConvoMenu';
import { Bell2Off_Filled_Corner0_Rounded as BellOffIcon } from '#/components/icons/Bell2';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon } from '#/components/icons/DotGrid';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { Link, LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { buildPath } from '#/routes';
import { colors } from '#/styles/colors';

import * as css from './MessagesListHeader.css';
import type { ConvoWithDetails } from './util';

const PFP_SIZE = 40;

export function MessagesListHeader({
	convo,
	ref,
}: {
	convo?: ConvoWithDetails | null;
	ref?: React.Ref<HTMLDivElement>;
}) {
	const moderationOpts = useModerationOpts();
	const { isWithinSplitView } = useIsWithinSplitView();

	return (
		<Layout.Header.Outer noBottomBorder={false} ref={ref}>
			<div className={css.outerRow}>
				{!isWithinSplitView && (
					<div className={css.backSlot}>
						<Layout.Header.BackButton />
					</div>
				)}
				{convo && moderationOpts ? (
					convo.kind === 'direct' ? (
						<ProfileHeaderReady convo={convo} moderationOpts={moderationOpts} />
					) : (
						<GroupHeaderReady convo={convo} />
					)
				) : (
					<div className={css.placeholderRow}>
						<div className={css.placeholderAvatar} />
						<div>
							<div className={css.placeholderLine} />
						</div>
					</div>
				)}
			</div>
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
				<div className={css.headingRow}>
					<Link
						className={css.headingOverlay}
						label={m['common.profile.a11y.viewDisplayName']({ name: displayName })}
						to={makeProfileLink(profile)}
					>
						{null}
					</Link>
					<div className={css.avatarLayer}>
						<PreviewableUserAvatar
							disableHoverCard={moderation.causes.some(
								(c) => c.type === ModerationCauseType.Blocking || c.type === ModerationCauseType.BlockedBy,
							)}
							moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
							profile={profile}
							size={PFP_SIZE}
						/>
					</div>
					<div className={css.headingColumn}>
						<div className={clsx(css.nameRow, css.nameRowSpaced)}>
							<Text className={css.name} numberOfLines={1} size="lg" weight="semiBold">
								{displayName}
							</Text>
							<div className={css.badgePad}>
								<ProfileBadges profile={profile} size="md" />
							</div>
							<MuteStatus muted={convo.view.muted} />
						</div>
						{handle ? (
							<Text color="textContrastHigh" numberOfLines={1} size="xs">
								{handle}
							</Text>
						) : null}
					</div>
				</div>
			}
			settings={
				<ConvoMenu
					blockInfo={blockInfo}
					convo={convo}
					currentScreen="conversation"
					profile={profile}
					render={
						<Button
							color="secondary"
							label={m['common.chat.settingsLabel']()}
							shape="round"
							size="small"
							variant="ghost"
						>
							<ButtonIcon icon={DotsHorizontalIcon} size="md" />
						</Button>
					}
				/>
			}
		/>
	);
}

function GroupHeaderReady({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	// a permanently locked group has no settings screen to open, so the header is inert.
	const disabled = convo.details.lockStatus === 'locked-permanently';
	const settingsTo = buildPath('MessagesConversationSettings', { conversation: convo.view.id });

	const nameBlock = (
		<>
			<AvatarBubbles profiles={convo.members} size={40} />
			<div className={css.nameRow}>
				<Text className={css.name} numberOfLines={1} size="lg" weight="semiBold">
					{convo.details.name}
				</Text>
				<MuteStatus muted={convo.view.muted} />
			</div>
		</>
	);

	return (
		<Wrapper
			heading={
				disabled ? (
					<div className={css.headingLink}>{nameBlock}</div>
				) : (
					<Link className={css.headingLink} label={convo.details.name} to={settingsTo}>
						{nameBlock}
					</Link>
				)
			}
			settings={
				disabled ? (
					<Button
						color="secondary"
						disabled
						label={m['components.dms.group.action.openSettings']()}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={DotsHorizontalIcon} size="md" />
					</Button>
				) : (
					<LinkButton
						color="secondary"
						label={m['components.dms.group.action.openSettings']()}
						shape="round"
						size="small"
						to={settingsTo}
						variant="ghost"
					>
						<ButtonIcon icon={DotsHorizontalIcon} size="md" />
					</LinkButton>
				)
			}
		/>
	);
}

function Wrapper({ heading, settings }: { heading: React.ReactNode; settings: React.ReactNode }) {
	return (
		<div className={css.wrapper}>
			<div className={css.wrapperRow}>
				<div className={css.headingWrap}>{heading}</div>

				<Layout.Header.Slot>{settings}</Layout.Header.Slot>
			</div>
		</div>
	);
}

function MuteStatus({ muted }: { muted: boolean }) {
	return muted ? (
		<>
			<Text color="textContrastMedium"> &middot; </Text>
			<BellOffIcon fill={colors.textContrastMedium} size="sm" />
		</>
	) : undefined;
}
