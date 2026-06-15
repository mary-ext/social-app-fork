import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AppBskyEmbedVideo } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { noRowLink } from '#/components/BlockLink';
import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { useFullscreen } from '#/components/hooks/useFullscreen';
import {
	HLSUnsupportedError,
	VideoEmbedInnerWeb,
	VideoNotFoundError,
} from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb';

import { IS_WEB_FIREFOX } from '#/env';

import { useActiveVideoWeb } from './ActiveVideoWebContext';
import * as styles from './index.css';
import * as VideoFallback from './VideoEmbedInner/VideoFallback';

const noop = () => {};

export function VideoEmbed({ embed }: { embed: AppBskyEmbedVideo.View }) {
	const ref = useRef<HTMLDivElement>(null);
	const { active: activeFromContext, setActive, sendPosition, currentActiveView } = useActiveVideoWeb();
	const [onScreen, setOnScreen] = useState(false);
	const [isFullscreen] = useFullscreen();
	const lastKnownTime = useRef<number | undefined>(undefined);

	const isGif = embed.presentation === 'gif';
	// GIFs don't participate in the "one video at a time" system
	const active = isGif || activeFromContext;

	useEffect(() => {
		if (!ref.current) return;
		if (isFullscreen && !IS_WEB_FIREFOX) return;
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) return;
				setOnScreen(entry.isIntersecting);
				// GIFs don't send position - they don't compete to be the active video
				if (!isGif) {
					sendPosition(entry.boundingClientRect.y + entry.boundingClientRect.height / 2);
				}
			},
			{ threshold: 0.5 },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [sendPosition, isFullscreen, isGif]);

	const [key, setKey] = useState(0);
	const renderError = useCallback(
		(error: unknown) => <VideoError error={error} retry={() => setKey(key + 1)} />,
		[key],
	);

	let aspectRatio: number | undefined;
	const dims = embed.aspectRatio;
	if (dims) {
		aspectRatio = dims.width / dims.height;
		if (Number.isNaN(aspectRatio)) {
			aspectRatio = undefined;
		}
	}

	// the box keeps the video's shape but is never taller than square (1:1) in feeds, so portrait
	// videos don't dominate.
	const boxAspectRatio = Math.max(aspectRatio ?? 1, 1);

	const contents = (
		<div
			ref={ref}
			className={styles.contents}
			style={assignInlineVars({
				[styles.aspectVar]: String(boxAspectRatio),
				[styles.thumbVar]: `url(${embed.thumbnail})`,
			})}
			{...noRowLink}
		>
			<ErrorBoundary renderError={renderError} key={key}>
				<OnlyNearScreen>
					<VideoEmbedInnerWeb
						embed={embed}
						active={active}
						setActive={setActive}
						onScreen={onScreen}
						lastKnownTime={lastKnownTime}
					/>
				</OnlyNearScreen>
			</ErrorBoundary>
		</div>
	);

	return (
		<div className={styles.root}>
			<ViewportObserver
				sendPosition={isGif ? noop : sendPosition}
				isAnyViewActive={currentActiveView !== null}
			>
				<div className={styles.box}>{contents}</div>
			</ViewportObserver>
		</div>
	);
}

const NearScreenContext = createContext(false);
NearScreenContext.displayName = 'VideoNearScreenContext';

/**
 * Renders a 100vh tall div and watches it with an IntersectionObserver to send the position of the div when
 * it's near the screen.
 *
 * IMPORTANT: ViewportObserver _must_ not be within a `overflow: hidden` container.
 */
function ViewportObserver({
	children,
	sendPosition,
	isAnyViewActive,
}: {
	children: React.ReactNode;
	sendPosition: (position: number) => void;
	isAnyViewActive: boolean;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [nearScreen, setNearScreen] = useState(false);
	const [isFullscreen] = useFullscreen();
	const isWithinMessage = useIsWithinMessage();

	// Send position when scrolling. This is done with an IntersectionObserver
	// observing a div of 100vh height
	useEffect(() => {
		if (!ref.current) return;
		if (isFullscreen && !IS_WEB_FIREFOX) return;
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) return;
				const position = entry.boundingClientRect.y + entry.boundingClientRect.height / 2;
				sendPosition(position);
				setNearScreen(entry.isIntersecting);
			},
			{ threshold: Array.from({ length: 101 }, (_, i) => i / 100) },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [sendPosition, isFullscreen]);

	// In case scrolling hasn't started yet, send up the position
	useEffect(() => {
		if (ref.current && !isAnyViewActive) {
			const rect = ref.current.getBoundingClientRect();
			const position = rect.y + rect.height / 2;
			sendPosition(position);
		}
	}, [isAnyViewActive, sendPosition]);

	return (
		<div className={styles.viewport}>
			<NearScreenContext.Provider value={nearScreen}>{children}</NearScreenContext.Provider>
			<div
				ref={ref}
				className={clsx(styles.observer, isWithinMessage ? styles.observerInMessage : styles.observerDefault)}
			/>
		</div>
	);
}

/**
 * Awkward data flow here, but we need to hide the video when it's not near the screen. But also,
 * ViewportObserver _must_ not be within a `overflow: hidden` container. So we put it at the top level of the
 * component tree here, then hide the children of the auto-resizing container.
 */
export const OnlyNearScreen = ({ children }: { children: React.ReactNode }) => {
	const nearScreen = useContext(NearScreenContext);

	return nearScreen ? children : null;
};

function VideoError({ error, retry }: { error: unknown; retry: () => void }) {
	const { t: l } = useLingui();

	let showRetryButton = true;
	let text = null;

	if (error instanceof VideoNotFoundError) {
		text = l`Video not found.`;
	} else if (error instanceof HLSUnsupportedError) {
		showRetryButton = false;
		text = l`This video can’t be played on your device. Your browser or system may be missing the required video codecs (H.264/AAC).`;
	} else {
		text = l`An error occurred while loading the video. Please try again.`;
	}

	return (
		<VideoFallback.Container>
			<VideoFallback.Text>{text}</VideoFallback.Text>
			{showRetryButton && <VideoFallback.RetryButton onPress={retry} />}
		</VideoFallback.Container>
	);
}
