import type { Ref } from 'react';

import {
	type BlockingModerationCause,
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	ModerationCauseType,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { profileTarget } from '#/lib/routes/targets';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/moderation/moderation-opts';

import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { ConvoMenu } from '#/components/dms/ConvoMenu';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { Link, LinkButton } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import BellOffIcon from '#/icons/central/BellOff_round_filled_radius1_stroke2.svg';
import DotsHorizontalIcon from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import type { RouteTarget } from '#/router';

import * as css from './MessagesListHeader.css';
import type { ConvoWithDetails } from './util';

const PFP_SIZE = 36;

export function MessagesListHeader({
	convo,
	ref,
}: {
	convo?: ConvoWithDetails | null;
	ref?: Ref<HTMLDivElement>;
}) {
	const moderationOpts = useModerationOpts();
	const { isWithinSplitView } = useIsWithinSplitView();

	return (
		<Layout.Header.Outer noBottomBorder={false} ref={ref}>
			{!isWithinSplitView && <Layout.Header.BackButton />}

			{convo && moderationOpts ? (
				convo.kind === 'direct' ? (
					<ProfileHeaderReady convo={convo} moderationOpts={moderationOpts} />
				) : (
					<GroupHeaderReady convo={convo} />
				)
			) : (
				<Skeleton.Row align="center" gap="sm">
					<Skeleton.Circle color="contrast_25" size={PFP_SIZE} />
					<Skeleton.Text color="contrast_25" size="lg" width={150} />
				</Skeleton.Row>
			)}
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
	const displayName = isDeletedAccount ? m['common.account.deleted']() : profile.handle;

	return (
		<>
			<div className={css.headingRow}>
				<Link
					className={css.headingOverlay}
					label={m['common.profile.a11y.viewDisplayName']({ name: displayName })}
					to={profileTarget(profile.did)}
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
				<div className={css.nameRow}>
					<Text className={css.name} numberOfLines={1} size="lg" weight="semiBold">
						{displayName}
					</Text>
					<div className={css.badgePad}>
						<ProfileBadges profile={profile} size="md" />
					</div>
					<MuteStatus muted={convo.view.muted} />
				</div>
			</div>

			<Layout.Header.Slot>
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
			</Layout.Header.Slot>
		</>
	);
}

function GroupHeaderReady({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	// a permanently locked group has no settings screen to open, so the header is inert.
	const disabled = convo.details.lockStatus === 'locked-permanently';
	const settingsTo: RouteTarget = {
		name: 'MessagesConversationSettings',
		conversation: convo.view.id,
	};

	const nameBlock = (
		<>
			<AvatarBubbles profiles={convo.members} size={PFP_SIZE} />
			<div className={css.nameRow}>
				<Text className={css.name} numberOfLines={1} size="lg" weight="semiBold">
					{convo.details.name}
				</Text>
				<MuteStatus muted={convo.view.muted} />
			</div>
		</>
	);

	return (
		<>
			{disabled ? (
				<div className={css.headingLink}>{nameBlock}</div>
			) : (
				<Link className={css.headingLink} label={convo.details.name} to={settingsTo}>
					{nameBlock}
				</Link>
			)}

			<Layout.Header.Slot>
				{disabled ? (
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
				)}
			</Layout.Header.Slot>
		</>
	);
}

function MuteStatus({ muted }: { muted: boolean }) {
	return muted ? (
		<>
			<Text color="textContrastMedium"> &middot; </Text>
			<BellOffIcon className={css.bellOffIcon} />
		</>
	) : undefined;
}
