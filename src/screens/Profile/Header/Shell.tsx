import { useCallback } from 'react';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { clsx } from 'clsx';

import type { NavigationProp } from '#/lib/routes/types';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { LabelsOnMe } from '#/components/moderation/LabelsOnMe';
import { ProfileHeaderAlerts } from '#/components/moderation/ProfileHeaderAlerts';
import { UserAvatar } from '#/components/UserAvatar';
import { UserBanner } from '#/components/UserBanner';
import { useDialogHandle } from '#/components/web/Dialog';

import { EditLiveDialog } from '#/features/liveNow/components/EditLiveDialog';
import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';
import { LiveStatusDialog } from '#/features/liveNow/components/LiveStatus';

import { useProfileHeader } from './Context';
import * as css from './Shell.css';

/**
 * The fixed profile-header scaffold: banner with back button, the overlapping avatar with its live ring, and
 * the moderation alerts. Variants pass the header body as `children`.
 */
export function ProfileHeaderShell({ children }: { children: React.ReactNode }): React.ReactNode {
	const { t: l } = useLingui();
	const {
		meta: { hideBackButton, isMe, isPlaceholderProfile, live },
		state: { moderation, profile },
	} = useProfileHeader();
	const { lightboxControl } = useGlobalDialogsControlContext();
	const navigation = useNavigation<NavigationProp>();
	const liveStatusHandle = useDialogHandle();

	const mediaModeration = getDisplayRestrictions(moderation, DisplayContext.ProfileMedia);
	const isLabeler = !!profile.associated?.labeler;

	const openLightbox = useCallback(
		(uri: string) => {
			lightboxControl.openWithPayload({ images: [{ src: uri }], index: 0 });
		},
		[lightboxControl],
	);

	const onPressBack = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	}, [navigation]);

	const onPressBanner = useCallback(() => {
		if (profile.banner && !(mediaModeration.blurs.length > 0 && mediaModeration.noOverride)) {
			openLightbox(profile.banner);
		}
	}, [profile.banner, mediaModeration, openLightbox]);

	const onPressAvi = useCallback(() => {
		if (live.isActive) {
			liveStatusHandle.open(null);
		} else if (profile.avatar && !(mediaModeration.blurs.length > 0 && mediaModeration.noOverride)) {
			openLightbox(profile.avatar);
		}
	}, [live.isActive, liveStatusHandle, profile.avatar, mediaModeration, openLightbox]);

	return (
		<div className={css.frame}>
			<div className={css.bannerRegion}>
				{/* first in source order so it tabs first; its z-index (see css) keeps it painted over the banner */}
				{!hideBackButton && (
					<button type="button" className={css.backButton} aria-label={l`Back`} onClick={onPressBack}>
						<span className={css.backButtonInner}>
							<ArrowLeftIcon size="lg" fill="white" />
						</span>
					</button>
				)}
				{isPlaceholderProfile ? (
					<div className={css.bannerPlaceholder} />
				) : (
					<button
						type="button"
						className={css.bannerButton}
						aria-label={profile.banner ? l`View profile banner` : l`Profile banner placeholder`}
						onClick={onPressBanner}
					>
						<UserBanner
							type={isLabeler ? 'labeler' : 'default'}
							banner={profile.banner}
							moderation={mediaModeration}
						/>
					</button>
				)}
			</div>

			{/* placed before the header body so its tab order matches its visual spot (top-left, over the banner edge) */}
			<div className={css.avatarAnchor}>
				<button
					type="button"
					className={css.avatarButton}
					aria-label={l`View ${profile.handle}'s avatar`}
					onClick={onPressAvi}
				>
					<span
						className={clsx(
							css.avatarRing,
							live.isActive && css.avatarRingLive,
							isLabeler && css.avatarRingLabeler,
						)}
					>
						<span className={css.avatarInner}>
							<UserAvatar
								type={isLabeler ? 'labeler' : 'user'}
								size={live.isActive ? 88 : 90}
								avatar={profile.avatar}
								moderation={mediaModeration}
								noBorder
							/>
							{live.isActive && <LiveIndicator size="large" />}
						</span>
					</span>
				</button>
			</div>

			{children}

			{!isPlaceholderProfile &&
				(isMe ? (
					<LabelsOnMe className={css.headerAlerts} labels={profile.labels} type="account" />
				) : (
					<ProfileHeaderAlerts className={css.headerAlerts} moderation={moderation} />
				))}

			{live.isActive &&
				(isMe ? (
					<EditLiveDialog
						embed={live.embed as AppBskyEmbedExternal.View}
						handle={liveStatusHandle}
						status={live}
					/>
				) : (
					<LiveStatusDialog
						embed={live.embed as AppBskyEmbedExternal.View}
						handle={liveStatusHandle}
						status={live}
						profile={profile}
					/>
				))}
		</div>
	);
}
