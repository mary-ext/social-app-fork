import { memo, useCallback, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { BACK_HITSLOP } from '#/lib/constants';
import type { NavigationProp } from '#/lib/routes/types';

import type { Shadow } from '#/state/cache/types';
import { useSession } from '#/state/session';

import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { UserBanner } from '#/view/com/util/UserBanner';

import { atoms as a, useTheme, utils } from '#/alf';

import { Button } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { LabelsOnMe } from '#/components/moderation/LabelsOnMe';
import { ProfileHeaderAlerts } from '#/components/moderation/ProfileHeaderAlerts';
import { UserAvatar } from '#/components/web/UserAvatar';

import { useActorStatus } from '#/features/liveNow';
import { EditLiveDialog } from '#/features/liveNow/components/EditLiveDialog';
import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';
import { LiveStatusDialog } from '#/features/liveNow/components/LiveStatusDialog';

import { GrowableAvatar } from './GrowableAvatar';
import { GrowableBanner } from './GrowableBanner';
import * as css from './Shell.css';

interface Props {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	moderation: ModerationDecision;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
}

let ProfileHeaderShell = ({
	children,
	profile,
	moderation,
	hideBackButton = false,
	isPlaceholderProfile,
}: React.PropsWithChildren<Props>): React.ReactNode => {
	const t = useTheme();
	const { currentAccount } = useSession();
	const { t: l } = useLingui();
	const { lightboxControl } = useGlobalDialogsControlContext();
	const navigation = useNavigation<NavigationProp>();
	useSafeAreaInsets();
	const liveStatusControl = useDialogControl();

	const onPressBack = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	}, [navigation]);

	const _openLightbox = useCallback(
		(uri: string) => {
			lightboxControl.openWithPayload({
				images: [{ src: uri }],
				index: 0,
			});
		},
		[lightboxControl],
	);

	const isMe = useMemo(() => currentAccount?.did === profile.did, [currentAccount, profile]);

	const live = useActorStatus(profile);

	useEffect(() => {
		if (live.isActive) {
		}
	}, [live.isActive, profile.did]);

	const onPressAvi = useCallback(() => {
		if (live.isActive) {
			liveStatusControl.open();
		} else {
			const modui = getDisplayRestrictions(moderation, DisplayContext.ProfileMedia);
			const avatar = profile.avatar;
			if (avatar && !(modui.blurs.length > 0 && modui.noOverride)) {
				_openLightbox(avatar);
			}
		}
	}, [profile, moderation, _openLightbox, liveStatusControl, live]);

	const onPressBanner = useCallback(() => {
		const modui = getDisplayRestrictions(moderation, DisplayContext.ProfileMedia);
		const banner = profile.banner;
		if (banner && !(modui.blurs.length > 0 && modui.noOverride)) {
			_openLightbox(banner);
		}
	}, [profile.banner, moderation, _openLightbox]);

	return (
		<View style={t.atoms.bg} pointerEvents={'box-none'}>
			<View pointerEvents={'box-none'} style={[a.relative, { height: 150 }]}>
				<GrowableBanner
					testID={profile.banner ? 'userBannerImage' : 'userBannerFallback'}
					label={profile.banner ? l`View profile banner` : l`Profile banner placeholder`}
					onPress={isPlaceholderProfile ? undefined : onPressBanner}
					backButton={
						!hideBackButton && (
							<Button
								testID="profileHeaderBackBtn"
								onPress={onPressBack}
								hitSlop={BACK_HITSLOP}
								label={l`Back`}
								style={[
									a.absolute,
									a.pointer,
									{
										top: 10,
										left: 18,
									},
								]}
							>
								{({ hovered }) => (
									<View
										style={[
											a.align_center,
											a.justify_center,
											a.rounded_full,
											{
												width: 31,
												height: 31,
												backgroundColor: utils.alpha('#000', 0.5),
											},
											hovered && {
												backgroundColor: utils.alpha('#000', 0.75),
											},
										]}
									>
										<ArrowLeftIcon size="lg" fill="white" />
									</View>
								)}
							</Button>
						)
					}
				>
					{isPlaceholderProfile ? (
						<LoadingPlaceholder width="100%" height="100%" style={{ borderRadius: 0 }} />
					) : (
						<UserBanner
							type={profile.associated?.labeler ? 'labeler' : 'default'}
							banner={profile.banner}
							moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
						/>
					)}
				</GrowableBanner>
			</View>
			{children}
			{!isPlaceholderProfile &&
				(isMe ? (
					<LabelsOnMe
						type="account"
						labels={profile.labels}
						style={[a.px_lg, a.pt_xs, a.pb_sm, { pointerEvents: 'box-none' }]}
					/>
				) : (
					<ProfileHeaderAlerts className={css.headerAlerts} moderation={moderation} />
				))}
			<GrowableAvatar style={[a.absolute, { top: 104, left: 10 }]}>
				<Pressable
					testID="profileHeaderAviButton"
					onPress={onPressAvi}
					accessibilityRole="image"
					accessibilityLabel={l`View ${profile.handle}'s avatar`}
					accessibilityHint=""
				>
					<View
						style={[
							t.atoms.bg,
							a.rounded_full,
							{
								width: 94,
								height: 94,
								borderWidth: live.isActive ? 3 : 2,
								borderColor: live.isActive ? t.palette.negative_500 : t.atoms.bg.backgroundColor,
							},
							profile.associated?.labeler && a.rounded_md,
						]}
					>
						<View>
							<UserAvatar
								type={profile.associated?.labeler ? 'labeler' : 'user'}
								size={live.isActive ? 88 : 90}
								avatar={profile.avatar}
								moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
								noBorder
							/>
							{live.isActive && <LiveIndicator size="large" />}
						</View>
					</View>
				</Pressable>
			</GrowableAvatar>
			{live.isActive &&
				(isMe ? (
					<EditLiveDialog
						control={liveStatusControl}
						status={live}
						embed={live.embed as AppBskyEmbedExternal.View}
					/>
				) : (
					<LiveStatusDialog
						control={liveStatusControl}
						status={live}
						embed={live.embed as AppBskyEmbedExternal.View}
						profile={profile}
					/>
				))}
		</View>
	);
};

ProfileHeaderShell = memo(ProfileHeaderShell);
export { ProfileHeaderShell };
