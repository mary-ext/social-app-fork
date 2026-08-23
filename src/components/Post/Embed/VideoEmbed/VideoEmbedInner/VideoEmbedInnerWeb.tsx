import { type RefObject, useEffect, useId, useRef, useState } from 'react';

import type { AppBskyEmbedVideo } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { useIsFullscreen } from '#/lib/browser/fullscreen';
import { videoThumbnailUrl } from '#/lib/bsky-cdn';
import {
	attachHlsPlayer,
	isHlsPlayerSupported,
	type PlayerHandle,
	type PlayerStatus,
} from '#/lib/media/hls/client/attach';
import type { SubtitleTrack } from '#/lib/media/hls/client/subtitles';
import { BUFFER_AHEAD, type PlayerError, type Rendition } from '#/lib/media/hls/shared/protocol';

import { setSubtitlesEnabled, useSubtitlesEnabled } from '#/state/preferences/subtitles';

import { m } from '#/paraglide/messages';

import { AltBadge } from '../GifPresentationControls';
import { HLSUnsupportedError, VideoNotFoundError } from './errors';
import * as styles from './VideoEmbedInnerWeb.css';
import type { VideoQuality, VideoSubtitles } from './web-controls/SettingsMenu';
import { Controls } from './web-controls/VideoControls';

export function VideoEmbedInnerWeb({
	embed,
	authorDid,
	active,
	setActive,
	onScreen,
	canLoad,
	lastKnownTime,
}: {
	embed: AppBskyEmbedVideo.View;
	authorDid?: Did;
	active: boolean;
	setActive: () => void;
	onScreen: boolean;
	canLoad: boolean;
	/** mutable playback position persisted across remounts. */
	lastKnownTime: RefObject<number | undefined>;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [focused, setFocused] = useState(false);
	const figId = useId();
	const isFullscreen = useIsFullscreen();
	const isGif = embed.presentation === 'gif';
	// send error up to error boundary
	const [error, setError] = useState<Error | null>(null);
	if (error) {
		throw error;
	}

	const { playerLoading, quality, subtitles } = useHlsPlayer({
		playlist: embed.playlist,
		setError,
		videoRef,
		focused,
		canLoad,
	});

	useEffect(() => {
		if (lastKnownTime.current && videoRef.current) {
			videoRef.current.currentTime = lastKnownTime.current;
		}
	}, [lastKnownTime]);

	return (
		<div className={styles.root} aria-label={m['components.post.video.a11y.player']()}>
			<div ref={containerRef} style={{ height: '100%', width: '100%' }}>
				<figure style={{ margin: 0, position: 'absolute', inset: 0 }}>
					<video
						ref={videoRef}
						poster={videoThumbnailUrl(embed)}
						style={{ width: '100%', height: '100%', objectFit: 'contain' }}
						playsInline
						muted={isGif || !focused}
						aria-labelledby={embed.alt ? figId : undefined}
						onTimeUpdate={(e) => {
							// oxlint-disable-next-line react/immutability -- mutable output ref
							lastKnownTime.current = e.currentTarget.currentTime;
						}}
						loop
					/>
					{embed.alt && (
						<figcaption id={figId} className={styles.srOnly}>
							{embed.alt}
						</figcaption>
					)}
				</figure>
				{!isFullscreen && !isGif && embed.alt && <AltBadge text={embed.alt} position="top-right" />}
				<Controls
					videoRef={videoRef}
					active={active}
					setActive={setActive}
					focused={focused}
					setFocused={setFocused}
					playerLoading={playerLoading}
					onScreen={onScreen}
					fullscreenRef={containerRef}
					quality={quality}
					subtitles={subtitles}
					videoCid={embed.cid}
					authorDid={authorDid}
					isGif={isGif}
					altText={embed.alt}
				/>
			</div>
		</div>
	);
}

function useHlsPlayer({
	playlist,
	setError,
	videoRef,
	focused,
	canLoad,
}: {
	playlist: string;
	setError: (v: Error | null) => void;
	videoRef: RefObject<HTMLVideoElement | null>;
	focused: boolean;
	canLoad: boolean;
}) {
	const playerRef = useRef<PlayerHandle | undefined>(undefined);
	const [renditions, setRenditions] = useState<Rendition[]>([]);
	const [selectedRendition, setSelectedRendition] = useState(-1);
	const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
	const [preferredSubtitleTrack, setPreferredSubtitleTrack] = useState(0);
	const [status, setStatus] = useState<PlayerStatus>('loading');
	const subtitlesEnabled = useSubtitlesEnabled();

	const selectRendition = (index: number) => {
		setSelectedRendition(index);
		playerRef.current?.select(index);
	};

	// caption visibility persists; track choice is per player
	const selectSubtitleTrack = (track: number) => {
		if (track === -1) {
			setSubtitlesEnabled(false);
			return;
		}
		setPreferredSubtitleTrack(track);
		setSubtitlesEnabled(true);
	};

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !canLoad) {
			return;
		}
		if (!isHlsPlayerSupported()) {
			setError(new HLSUnsupportedError());
			return;
		}

		const player = attachHlsPlayer(video, playlist);
		playerRef.current = player;

		player.onRenditions((available, selected) => {
			setRenditions(available);
			setSelectedRendition(selected);
		});

		player.onSubtitles(setSubtitleTracks);

		player.onStatus(setStatus);

		player.onError((failure) => {
			setError(toAppError(failure));
		});

		return () => {
			playerRef.current = undefined;
			player.destroy();
			// clear data from the previous playlist
			setRenditions([]);
			setSelectedRendition(-1);
			setSubtitleTracks([]);
			setPreferredSubtitleTrack(0);
			setStatus('loading');
		};
	}, [canLoad, playlist, setError, videoRef]);

	useEffect(() => {
		playerRef.current?.setBufferAhead(focused ? BUFFER_AHEAD.focused : BUFFER_AHEAD.background);
	}, [focused]);

	const activeSubtitleTrack = subtitlesEnabled && subtitleTracks.length > 0 ? preferredSubtitleTrack : -1;
	useEffect(() => {
		playerRef.current?.selectSubtitle(subtitleTracks[activeSubtitleTrack]?.id ?? null);
	}, [activeSubtitleTrack, subtitleTracks]);

	return {
		playerLoading: canLoad && (status === 'loading' || status === 'retrying'),
		quality: { renditions, selected: selectedRendition, select: selectRendition } satisfies VideoQuality,
		subtitles: {
			tracks: subtitleTracks,
			selectedTrack: activeSubtitleTrack,
			selectTrack: selectSubtitleTrack,
			setCueLine: (line: number) => playerRef.current?.setCueLine(line),
		} satisfies VideoSubtitles,
	};
}

function toAppError(failure: PlayerError): Error {
	switch (failure.code) {
		case 'not_found': {
			return new VideoNotFoundError();
		}
		case 'unsupported': {
			return new HLSUnsupportedError();
		}
		default: {
			return new Error(failure.message);
		}
	}
}
