import { useRef, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { parseGifEmbedFromUrl, toGifEmbedUrl } from '#/lib/media/external-gif/embed';

import { hasMediaAlt } from '#/features/composer/media/alt-text';
import { gifPreviewUrl } from '#/features/gif-picker/utils';

import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Button } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { useEditorState } from '../../context';
import { DragThumbnail } from '../../dnd/DragPreview';
import type { PostMedia } from '../../model/schema';
import { keepEditorFocus } from '../../shared/editor-focus';
import { MediaTile, useMediaTileComposite } from '../tile/MediaTile';
import { AltButton, RemoveButton, TileActions, TileBadges } from '../tile/TileControls';
import * as css from './ExternalGifTile.css';

/**
 * GIF picker attachment tile.
 *
 * @param props attachment and interaction controls
 * @returns the tile
 */
export function ExternalGifTile({
	postId,
	index,
	item,
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'externalGif' }>;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const player = parseGifEmbedFromUrl(toGifEmbedUrl(item.gif));
	// reuse the poster for dragging to avoid loading the animated GIF.
	const url = gifPreviewUrl((player ? item.gif.media_formats.preview : item.gif.media_formats.gif).url);
	const { composite, tabbable } = useMediaTileComposite();

	const togglePlayback = () => {
		const video = videoRef.current;
		if (!video) {
			return;
		}

		if (video.paused) {
			void video.play();
		} else {
			video.pause();
		}
	};

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={m['features.composer.media.a11y.gif']()}
			dragPreview={<DragThumbnail src={url} />}
			composite={composite}
			className={css.tile}
			style={assignInlineVars({ [css.ratioVar]: String(item.aspectRatio ?? 1) })}
			onRemove={onRemove}
			onTogglePlayback={player ? togglePlayback : undefined}
		>
			{player ? (
				<>
					<video
						ref={videoRef}
						className={css.media}
						poster={url}
						preload="none"
						playsInline
						loop
						muted
						onPlay={() => setIsPlaying(true)}
						onPause={() => setIsPlaying(false)}
					>
						{player.playerSources.map((source) => (
							<source key={source.src} src={source.src} type={source.type} />
						))}
					</video>

					<Button
						label={isPlaying ? m['common.gif.a11y.pause']() : m['common.gif.a11y.play']()}
						className={css.playback}
						variant="bare"
						// the tile handles Space; avoid a duplicate tab stop.
						tabIndex={-1}
						onMouseDown={keepEditorFocus}
						onClick={togglePlayback}
					>
						{!isPlaying && <PlayButtonIcon />}
					</Button>
				</>
			) : (
				<img className={css.media} src={url} alt="" />
			)}

			<TileBadges>
				<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			</TileBadges>

			<TileActions>
				<RemoveButton isUploading={false} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}
