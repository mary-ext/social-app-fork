import { createContext, useContext, useEffect, useRef, useState } from 'react';

import type { AppBskyEmbedVideo } from '@atcute/bluesky';

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
import { m } from '#/paraglide/messages';

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
		if (!ref.current) {
			return;
		}
		if (isFullscreen && !IS_WEB_FIREFOX) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) {
					return;
				}
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
	const renderError = (error: unknown) => <VideoError error={error} retry={() => setKey(key + 1)} />;

	let aspectRatio: number | undefined;
	const dims = embed.aspectRatio;
	if (dims) {
		aspectRatio = dims.width / dims.height;
		if (Number.isNaN(aspectRatio)) {
			aspectRatio = undefined;
		}
	}

	// the box keeps the video's own shape (`index.css` caps the height by clamping the box width), so a
	// portrait video sits narrow rather than dominating the column.
	const boxAspectRatio = aspectRatio ?? 1;

	const contents = (
		<div ref={ref} className={styles.contents} {...noRowLink}>
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
				<div
					className={styles.box}
					style={assignInlineVars({
						[styles.aspectVar]: String(boxAspectRatio),
						[styles.thumbVar]: `url(${embed.thumbnail})`,
					})}
				>
					{contents}
				</div>
			</ViewportObserver>
		</div>
	);
}

const NearScreenContext = createContext(false);
NearScreenContext.displayName = 'VideoNearScreenContext';

/**
 * renders a 100vh tall div and tracks its viewport position via IntersectionObserver.
 *
 * note: do not place inside an `overflow: hidden` container.
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
		if (!ref.current) {
			return;
		}
		if (isFullscreen && !IS_WEB_FIREFOX) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) {
					return;
				}
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

/** hides the video when it is not near the screen by observing the viewport. */
export const OnlyNearScreen = ({ children }: { children: React.ReactNode }) => {
	const nearScreen = useContext(NearScreenContext);

	return nearScreen ? children : null;
};

function VideoError({ error, retry }: { error: unknown; retry: () => void }) {
	let showRetryButton = true;
	let text = null;

	if (error instanceof VideoNotFoundError) {
		text = m['components.post.video.error.notFound']();
	} else if (error instanceof HLSUnsupportedError) {
		showRetryButton = false;
		text = m['components.post.video.error.unsupportedCodec']();
	} else {
		text = m['components.post.video.error.load']();
	}

	return (
		<VideoFallback.Container>
			<VideoFallback.Text>{text}</VideoFallback.Text>
			{showRetryButton && <VideoFallback.RetryButton onPress={retry} />}
		</VideoFallback.Container>
	);
}
