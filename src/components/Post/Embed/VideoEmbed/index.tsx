import { lazy, Suspense, useRef, useState } from 'react';

import type { AppBskyEmbedVideo } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { videoThumbnailUrl } from '#/lib/bsky-cdn';

import { noRowLink } from '#/components/BlockLink';
import { ErrorBoundary } from '#/components/ErrorBoundary';
import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';
import {
	HLSUnsupportedError,
	VideoNotFoundError,
} from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/errors';

import { m } from '#/paraglide/messages';

import { useActiveVideo } from './active-video';
import * as styles from './index.css';
import * as VideoFallback from './VideoEmbedInner/VideoFallback';

const VideoEmbedInnerWeb = lazy(() =>
	import('#/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb').then((mod) => ({
		default: mod.VideoEmbedInnerWeb,
	})),
);

const MIN_CARD_WIDTH = 280;

export function VideoEmbed({ embed, authorDid }: { embed: AppBskyEmbedVideo.View; authorDid?: Did }) {
	const ref = useRef<HTMLDivElement>(null);
	const { isActive, mayLoad, nearScreen, onScreen, setActive } = useActiveVideo(ref);
	const lastKnownTime = useRef<number | undefined>(undefined);

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
	// portrait video sits narrow rather than dominating the column — but only down to a floor, past which the
	// card is too narrow to lay out the controls. below it the box widens and the video letterboxes inside,
	// which costs a couple of thin bars but keeps the player usable.
	const boxAspectRatio = Math.max(aspectRatio ?? 1, MIN_CARD_WIDTH / MAX_MEDIA_HEIGHT);

	const thumbnail = videoThumbnailUrl(embed);

	return (
		<div className={styles.root}>
			<div
				ref={ref}
				className={styles.box}
				style={assignInlineVars({
					[styles.aspectVar]: String(boxAspectRatio),
					[styles.thumbVar]: thumbnail ? `url('${thumbnail}')` : 'none',
				})}
			>
				<div className={styles.contents} {...noRowLink}>
					<ErrorBoundary renderError={renderError} key={key}>
						{nearScreen && (
							<Suspense fallback={null}>
								<VideoEmbedInnerWeb
									embed={embed}
									authorDid={authorDid}
									active={isActive}
									setActive={setActive}
									onScreen={onScreen}
									canLoad={mayLoad}
									lastKnownTime={lastKnownTime}
								/>
							</Suspense>
						)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
}

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
