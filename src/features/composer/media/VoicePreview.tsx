import { useRef, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { VoiceAsset } from '#/lib/media/read-attachment';
import { FALLBACK_BACKGROUND, toCssColor } from '#/lib/media/transcode/voice/palette';
import { getBlobUrl } from '#/lib/utils/blob-url';

import { ExternalEmbedRemoveBtn } from '#/features/composer/ExternalEmbedRemoveBtn';

import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { formatTime } from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/web-controls/utils';

import defaultAvatarUrl from '#/assets/default-avatar-user.svg?url';
import VolumeIcon from '#/icons/central/VolumeFull_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { playButtonOverlay } from './VideoPreview.css';
import * as css from './VoicePreview.css';

const LOBES = [
	css.lobeQuadrant.southEast,
	css.lobeQuadrant.southWest,
	css.lobeQuadrant.northWest,
	css.lobeQuadrant.northEast,
];

/**
 * previews the voice card with source-audio playback.
 *
 * @param props.asset the source audio
 * @param props.avatar the posting account's avatar URL, if any
 * @param props.background CSS background color; null uses the fallback color
 * @param props.clear removes the voice clip
 * @returns the voice preview
 */
export function VoicePreview({
	asset,
	avatar,
	background,
	clear,
}: {
	asset: VoiceAsset;
	avatar: string | undefined;
	background: string | null;
	clear: () => void;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const togglePlayback = () => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		if (audio.paused) {
			audio.play().catch((err: unknown) => {
				console.error('Voice clip preview failed to play', err);
			});
		} else {
			audio.pause();
		}
	};

	return (
		<div
			className={css.container}
			style={assignInlineVars({
				[css.backgroundVar]: background ?? toCssColor(FALLBACK_BACKGROUND),
			})}
		>
			<button
				type="button"
				aria-label={isPlaying ? m['view.composer.voice.a11y.pause']() : m['view.composer.voice.a11y.play']()}
				className={clsx(css.stage, isPlaying && css.playing)}
				onClick={togglePlayback}
			>
				{LOBES.map((quadrant) => (
					<span key={quadrant} className={clsx(css.lobe, quadrant)} />
				))}
				<img src={avatar ?? defaultAvatarUrl} alt="" className={css.avatar} />
			</button>

			<div aria-hidden className={css.overlay}>
				<span className={css.meta}>
					{asset.duration !== null && <span>{formatTime(asset.duration / 1000)}</span>}
					<VolumeIcon className={css.icon} />
				</span>
				<span className={css.label}>{m['view.composer.voice.cardLabel']()}</span>
			</div>

			{!isPlaying && (
				<div className={playButtonOverlay}>
					<PlayButtonIcon />
				</div>
			)}

			<audio
				ref={audioRef}
				src={getBlobUrl(asset.blob)}
				preload="metadata"
				onPlay={() => setIsPlaying(true)}
				onPause={() => setIsPlaying(false)}
			/>

			<ExternalEmbedRemoveBtn onRemove={clear} />
		</div>
	);
}
