import { useCallback, useMemo } from 'react';
import type { AnyProfileView, AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateStatus } from '@atcute/bluesky-moderation';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import type { NavigationProp } from '#/lib/routes/types';
import { sanitizeHandle } from '#/lib/strings/handles';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';

import { EmbedThumb } from '#/components/EmbedThumb';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRightIcon } from '#/components/icons/SquareArrowTopRight';
import { ContentHider } from '#/components/moderation/ContentHider';
import { useGlobalReportDialogControl } from '#/components/moderation/ReportDialog';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLinkButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';
import * as css from '#/features/liveNow/components/LiveStatusDialog.css';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

/**
 * A touch-only dialog that surfaces a live status (no hover affordance on touch devices). Open it
 * imperatively through `handle.open()`.
 */
export function LiveStatusDialog({
	embed,
	handle,
	profile,
	status,
}: {
	embed: AppBskyEmbedExternal.View;
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	status: AppBskyActorDefs.StatusView;
}) {
	const navigation = useNavigation<NavigationProp>();

	const onPressOpenProfile = useCallback(() => {
		handle.close();
		navigation.push('Profile', { name: profile.did });
	}, [handle, navigation, profile.did]);

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup
				className={css.dialogPopup}
				label={m['features.liveNow.badge.userIsLive']({ handle: sanitizeHandle(profile.handle) })}
			>
				<LiveStatus
					embed={embed}
					onPressOpenProfile={onPressOpenProfile}
					onRequestClose={() => handle.close()}
					profile={profile}
					status={status}
				/>
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

/**
 * The live-status card body: livestream media, title/domain, a watch CTA, and the streamer's identity. Shared
 * by {@link LiveStatusDialog} and the profile hover card.
 */
export function LiveStatus({
	embed,
	onPressOpenProfile,
	onRequestClose,
	padding = 'xl',
	profile,
	status,
}: {
	embed: AppBskyEmbedExternal.View;
	onPressOpenProfile: () => void;
	/** When set (i.e. inside a dialog), dismiss the host before opening the report dialog. */
	onRequestClose?: () => void;
	padding?: 'lg' | 'xl';
	profile: AnyProfileView;
	status: AppBskyActorDefs.StatusView;
}) {
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();
	const reportDialogControl = useGlobalReportDialogControl();

	const statusModeration = useMemo(() => {
		if (!moderationOpts) return undefined;
		return moderateStatus(profile, moderationOpts);
	}, [moderationOpts, profile]);

	const onReport = useCallback(() => {
		onRequestClose?.();
		reportDialogControl.openWithPayload({
			subject: {
				...status,
				$type: 'app.bsky.actor.defs#statusView',
			},
		});
	}, [onRequestClose, reportDialogControl, status]);

	const thumb = embed.external.thumb;

	return (
		<>
			{thumb && (
				<ContentHider
					className={css.media}
					modui={statusModeration && getDisplayRestrictions(statusModeration, DisplayContext.ContentMedia)}
				>
					<EmbedThumb frameClassName={css.mediaFrame} src={thumb} />
					<LiveIndicator className={css.liveBadge} size="large" />
				</ContentHider>
			)}
			<div
				className={clsx(
					css.content,
					css.padding[padding],
					padding === 'xl' && css.xlTop[thumb ? 'thumb' : 'noThumb'],
				)}
			>
				<div className={css.info}>
					<Text numberOfLines={3} size="xl" weight="semiBold">
						{embed.external.title || embed.external.uri}
					</Text>
					<div className={css.domain}>
						<GlobeIcon size="xs" fill={colors.textContrastMedium} />
						<Text color="textContrastMedium" numberOfLines={1} size="sm">
							{toNiceDomain(embed.external.uri)}
						</Text>
					</div>
				</div>

				<ExternalLinkButton
					className={css.watchButton}
					color="primary"
					label={m['features.liveNow.action.watchNow']()}
					size="small"
					href={embed.external.uri}
					variant="solid"
				>
					<ButtonText>{m['features.liveNow.action.watchNow']()}</ButtonText>
					<ButtonIcon icon={SquareArrowTopRightIcon} />
				</ExternalLinkButton>

				<div className={css.divider} />

				{moderationOpts && (
					<ProfileCard.Header>
						<ProfileCard.Avatar
							disabledPreview
							liveOverride={false}
							moderationOpts={moderationOpts}
							profile={profile}
						/>
						<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
						<Button
							color="secondary"
							label={m['features.liveNow.action.openProfile']()}
							onClick={() => {
								unstableCacheProfileView(queryClient, profile);
								onPressOpenProfile();
							}}
							size="small"
							variant="solid"
						>
							<ButtonText>{m['features.liveNow.action.openProfile']()}</ButtonText>
						</Button>
					</ProfileCard.Header>
				)}

				<div className={css.betaRow}>
					<div className={css.beta}>
						<CircleInfoIcon size="sm" fill={colors.textContrastLow} />
						<Text color="textContrastLow" size="sm">
							{m['features.liveNow.badge.beta']()}
						</Text>
					</div>
					<Button
						className={css.reportButton}
						label={m['common.action.report']()}
						onClick={onReport}
						variant="bare"
					>
						<Text color="textContrastMedium" size="sm">
							{m['common.action.report']()}
						</Text>
					</Button>
				</div>
			</div>
		</>
	);
}
