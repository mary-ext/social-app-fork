import { useCallback, useMemo } from 'react';
import type { AnyProfileView, AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateStatus } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
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
import * as css from '#/features/liveNow/components/LiveStatus.css';

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
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();

	const onPressOpenProfile = useCallback(() => {
		handle.close();
		navigation.push('Profile', { name: profile.did });
	}, [handle, navigation, profile.did]);

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.dialogPopup} label={l`${sanitizeHandle(profile.handle)} is live`}>
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
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();
	const reportDialogControl = useGlobalReportDialogControl();

	const statusModeration = useMemo(() => {
		if (!moderationOpts) return undefined;
		return moderateStatus(profile, moderationOpts);
	}, [moderationOpts, profile]);

	const onReport = useCallback(() => {
		onRequestClose?.();
		reportDialogControl.open({
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
						<span className={css.mutedIcon}>
							<GlobeIcon width={12} height={12} fill="currentColor" />
						</span>
						<Text color="textContrastMedium" numberOfLines={1} size="sm">
							{toNiceDomain(embed.external.uri)}
						</Text>
					</div>
				</div>

				<ExternalLinkButton
					className={css.watchButton}
					color="primary"
					label={l`Watch now`}
					size="small"
					href={embed.external.uri}
					variant="solid"
				>
					<ButtonText>
						<Trans>Watch now</Trans>
					</ButtonText>
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
							label={l`Open profile`}
							onClick={() => {
								unstableCacheProfileView(queryClient, profile);
								onPressOpenProfile();
							}}
							size="small"
							variant="solid"
						>
							<ButtonText>
								<Trans>Open profile</Trans>
							</ButtonText>
						</Button>
					</ProfileCard.Header>
				)}

				<div className={css.betaRow}>
					<div className={css.beta}>
						<span className={css.betaIcon}>
							<CircleInfoIcon width={16} height={16} fill="currentColor" />
						</span>
						<Text color="textContrastLow" size="sm">
							<Trans>Live feature is in beta</Trans>
						</Text>
					</div>
					<Button className={css.reportButton} label={l`Report`} onClick={onReport} variant="bare">
						<Text color="textContrastMedium" size="sm">
							<Trans>Report</Trans>
						</Text>
					</Button>
				</div>
			</div>
		</>
	);
}
