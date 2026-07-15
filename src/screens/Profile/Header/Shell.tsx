import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { preloadLightbox } from '#/components/Lightbox';
import { LabelsOnMe } from '#/components/moderation/LabelsOnMe';
import { ProfileHeaderAlerts } from '#/components/moderation/ProfileHeaderAlerts';
import { UserAvatar } from '#/components/UserAvatar';
import { UserBanner } from '#/components/UserBanner';
import * as Layout from '#/components/web/Layout';

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
		meta: { isMe, isPlaceholderProfile, live },
		state: { moderation, profile },
	} = useProfileHeader();
	const { lightboxHandle } = useGlobalDialogsHandleContext();
	const liveStatusHandle = Dialog.useDialogHandle();

	const mediaModeration = getDisplayRestrictions(moderation, DisplayContext.ProfileMedia);
	const isLabeler = !!profile.associated?.labeler;

	const canViewMedia = !(mediaModeration.blurs.length > 0 && mediaModeration.noOverride);

	// open the lightbox via Dialog.Trigger, not an imperative openWithPayload: the singleton also hosts every
	// post image's trigger, and Base UI would let one of those clobber an imperatively-set payload
	const bannerImage = (
		<UserBanner
			type={isLabeler ? 'labeler' : 'default'}
			banner={profile.banner}
			moderation={mediaModeration}
		/>
	);
	const avatarLabel = m['screens.profile.avatar.a11y.view']({ handle: profile.handle });
	const avatarBody = (
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
	);

	return (
		<div className={css.frame}>
			<Layout.Header.OuterOnBanner
				banner={
					isPlaceholderProfile ? (
						<div className={css.bannerPlaceholder} />
					) : profile.banner && canViewMedia ? (
						<Dialog.Trigger
							type="button"
							handle={lightboxHandle}
							payload={{ images: [{ src: profile.banner }], index: 0 }}
							className={css.bannerButton}
							aria-label={m['screens.profile.banner.a11y.view']()}
							onPointerDown={preloadLightbox}
						>
							{bannerImage}
						</Dialog.Trigger>
					) : (
						bannerImage
					)
				}
			>
				<Layout.Header.BackButton variant="scrim" />
			</Layout.Header.OuterOnBanner>
			{/* placed before the header body so its tab order matches its visual spot (top-left, over the banner edge) */}
			<div className={css.avatarAnchor}>
				{live.isActive ? (
					<button
						type="button"
						className={css.avatarButton}
						aria-label={avatarLabel}
						onClick={() => liveStatusHandle.open(null)}
					>
						{avatarBody}
					</button>
				) : profile.avatar && canViewMedia ? (
					<Dialog.Trigger
						type="button"
						handle={lightboxHandle}
						payload={{ images: [{ src: profile.avatar }], index: 0 }}
						className={css.avatarButton}
						aria-label={avatarLabel}
						onPointerDown={preloadLightbox}
					>
						{avatarBody}
					</Dialog.Trigger>
				) : (
					<div className={css.avatarBox}>{avatarBody}</div>
				)}
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
