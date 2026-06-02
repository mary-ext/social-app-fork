import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	type GestureResponderEvent,
	Pressable,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import Animated, {
	measure,
	runOnJS,
	useAnimatedRef,
	useFrameCallback,
} from '#/lib/animations/reanimatedCompat';
import type { NavigationProp } from '#/lib/routes/types';
import { type EmbedPlayerParams, getPlayerAspect } from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs } from '#/state/preferences';

import { EventStopper } from '#/view/com/util/EventStopper';

import { atoms as a, useTheme } from '#/alf';

import { EmbedConsentDialog } from '#/components/dialogs/EmbedConsent';
import { useDialogHandle } from '#/components/web/Dialog';
import { Fill } from '#/components/Fill';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';

import { Image } from '#/shims/image';

// This renders the overlay when the player is either inactive or loading as a separate layer
function PlaceholderOverlay({
	isLoading,
	isPlayerActive,
	onPress,
}: {
	isLoading: boolean;
	isPlayerActive: boolean;
	onPress: (event: GestureResponderEvent) => void;
}) {
	const { t: l } = useLingui();

	// If the player is active and not loading, we don't want to show the overlay.
	if (isPlayerActive && !isLoading) return null;

	return (
		<View style={[a.absolute, a.inset_0, { zIndex: 2 }]}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={l`Play Video`}
				accessibilityHint={l`Plays the video`}
				onPress={onPress}
				style={[a.flex_1, a.justify_center, a.align_center]}
			>
				{!isPlayerActive ? <PlayButtonIcon /> : <ActivityIndicator size="large" color="white" />}
			</Pressable>
		</View>
	);
}

// This renders the youtube/embed player iframe as a separate layer
function Player({
	params,
	onLoad,
	isPlayerActive,
}: {
	isPlayerActive: boolean;
	params: EmbedPlayerParams;
	onLoad: () => void;
}) {
	// Don't show the player until it is active
	if (!isPlayerActive) return null;

	return (
		<EventStopper style={[a.absolute, a.inset_0, { zIndex: 3 }]}>
			{/*
			 * keying on the src remounts the iframe for a new embed rather than navigating the existing one.
			 * `allow="autoplay"` delegates the autoplay permission policy to the cross-origin frame — without
			 * it the browser ignores the `autoplay=1` in the player URL, since the default allowlist is `self`.
			 */}
			<iframe
				key={params.playerUri}
				src={params.playerUri}
				onLoad={onLoad}
				allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
				allowFullScreen
				style={StyleSheet.flatten([styles.iframe, a.bg_transparent]) as CSSProperties}
			/>
		</EventStopper>
	);
}

const styles = StyleSheet.create({
	iframe: {
		borderWidth: 0,
		height: '100%',
		width: '100%',
	},
});

// This renders the player area and handles the logic for when to show the player and when to show the overlay
export function ExternalPlayer({
	link,
	params,
}: {
	link: AppBskyEmbedExternal.ViewExternal;
	params: EmbedPlayerParams;
}) {
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const insets = useSafeAreaInsets();
	const windowDims = useWindowDimensions();
	const externalEmbedsPrefs = useExternalEmbedsPrefs();
	const consentDialogControl = useDialogHandle();

	const [isPlayerActive, setIsPlayerActive] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const aspect = useMemo(() => {
		return getPlayerAspect({
			type: params.type,
			width: windowDims.width,
			hasThumb: !!link.thumb,
		});
	}, [params.type, windowDims.width, link.thumb]);

	const viewRef = useAnimatedRef();
	const frameCallback = useFrameCallback(() => {
		const measurement = measure(viewRef);
		if (!measurement) return;

		const { height: winHeight } = windowDims;

		// Get the proper screen height depending on what is going on
		const realWinHeight = winHeight; // On web, we always want the actual screen height

		const top = measurement.pageY;
		const bot = measurement.pageY + measurement.height;

		// We can use the same logic on all platforms against the screenHeight that we get above
		const isVisible = top <= realWinHeight - insets.bottom && bot >= insets.top;

		if (!isVisible) {
			runOnJS(setIsPlayerActive)(false);
		}
	}, false); // False here disables autostarting the callback

	// watch for leaving the viewport due to scrolling
	useEffect(() => {
		// We don't want to do anything if the player isn't active
		if (!isPlayerActive) return;

		// Interval for scrolling works in most cases, However, for twitch embeds, if we navigate away from the screen the webview will
		// continue playing. We need to watch for the blur event
		const unsubscribe = navigation.addListener('blur', () => {
			setIsPlayerActive(false);
		});

		// Start watching for changes
		frameCallback.setActive(true);

		return () => {
			unsubscribe();
			frameCallback.setActive(false);
		};
	}, [navigation, isPlayerActive, frameCallback]);

	const onLoad = useCallback(() => {
		setIsLoading(false);
	}, []);

	const onPlayPress = useCallback(
		(event: GestureResponderEvent) => {
			// Prevent this from propagating upward on web
			event.preventDefault();

			if (externalEmbedsPrefs?.[params.source] === undefined) {
				consentDialogControl.open(null);
				return;
			}

			setIsPlayerActive(true);
		},
		[externalEmbedsPrefs, consentDialogControl, params.source],
	);

	const onAcceptConsent = useCallback(() => {
		setIsPlayerActive(true);
	}, []);

	return (
		<>
			<EmbedConsentDialog handle={consentDialogControl} source={params.source} onAccept={onAcceptConsent} />

			<Animated.View ref={viewRef} collapsable={false} style={[aspect, a.overflow_hidden]}>
				{link.thumb && (!isPlayerActive || isLoading) ? (
					<>
						<Image
							style={[a.flex_1]}
							source={{ uri: link.thumb }}
							accessibilityIgnoresInvertColors
							loading="lazy"
						/>
						<Fill style={[t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg, { opacity: 0.3 }]} />
					</>
				) : (
					<Fill
						style={[
							{
								backgroundColor: t.name === 'light' ? t.palette.contrast_975 : 'black',
								opacity: 0.3,
							},
						]}
					/>
				)}
				<PlaceholderOverlay isLoading={isLoading} isPlayerActive={isPlayerActive} onPress={onPlayPress} />
				<Player isPlayerActive={isPlayerActive} params={params} onLoad={onLoad} />
			</Animated.View>
		</>
	);
}
