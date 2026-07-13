import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import { useNavigation } from '@react-navigation/native';
import { clsx } from 'clsx';

import type { NavigationProp } from '#/lib/routes/types';

import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { LabelsOnMe } from '#/components/moderation/LabelsOnMe';
import { ProfileHeaderAlerts } from '#/components/moderation/ProfileHeaderAlerts';
import { UserAvatar } from '#/components/UserAvatar';
import { UserBanner } from '#/components/UserBanner';

import { EditLiveDialog } from '#/features/liveNow/components/EditLiveDialog';
import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';
import { LiveStatusDialog } from '#/features/liveNow/components/LiveStatusDialog';
import { m } from '#/paraglide/messages';

import { useProfileHeader } from './Context';
import * as css from './Shell.css';

/**
 * profile-header scaffold displaying a banner with a back button, an overlapping avatar with a live ring, and
 * moderation alerts.
 *
 * @param children header body
 */
export function ProfileHeaderShell({ children }: { children: React.ReactNode }): React.ReactNode {
	const {
		meta: { hideBackButton, isMe, isPlaceholderProfile, live },
		state: { moderation, profile },
	} = useProfileHeader();
	const { lightboxHandle } = useGlobalDialogsHandleContext();
	const navigation = useNavigation<NavigationProp>();
	const liveStatusHandle = Dialog.useDialogHandle();

	const mediaModeration = getDisplayRestrictions(moderation, DisplayContext.ProfileMedia);
	const isLabeler = !!profile.associated?.labeler;

	const openLightbox = (uri: string) => {
		lightboxHandle.openWithPayload({ images: [{ src: uri }], index: 0 });
	};

	const onPressBack = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	};

	const onPressBanner = () => {
		if (profile.banner && !(mediaModeration.blurs.length > 0 && mediaModeration.noOverride)) {
			openLightbox(profile.banner);
		}
	};

	const onPressAvi = () => {
		if (live.isActive) {
			liveStatusHandle.open(null);
		} else if (profile.avatar && !(mediaModeration.blurs.length > 0 && mediaModeration.noOverride)) {
			openLightbox(profile.avatar);
		}
	};

	return (
		<div className={css.frame}>
			<div className={css.bannerRegion}>
				{/* first in source order so it tabs first; its z-index (see css) keeps it painted over the banner */}
				{!hideBackButton && (
					<button
						type="button"
						className={css.backButton}
						aria-label={m['common.action.back']()}
						onClick={onPressBack}
					>
						<span className={css.backButtonInner}>
							<ArrowLeftIcon size="xl" fill="white" />
						</span>
					</button>
				)}
				{isPlaceholderProfile ? (
					<div className={css.bannerPlaceholder} />
				) : (
					<button
						type="button"
						className={css.bannerButton}
						aria-label={
							profile.banner
								? m['screens.profile.banner.a11y.view']()
								: m['screens.profile.banner.a11y.placeholder']()
						}
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
					aria-label={m['screens.profile.avatar.a11y.view']({ handle: profile.handle })}
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
