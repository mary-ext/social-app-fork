import { clsx } from 'clsx';
import type { Level, MediaPlaylist } from 'hls.js';

import { codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import * as Menu from '#/components/Menu';

import SettingsGearIcon from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as controlButtonStyles from './ControlButton.css';
import * as styles from './SettingsMenu.css';

/** video renditions and selection. */
export type VideoQuality = {
	/** available renditions. */
	levels: Level[];
	/** active rendition, or `-1` before playback starts. */
	activeLevel: number;
	/** selected rendition, or `-1` for automatic selection. */
	selectedLevel: number;
	/**
	 * selects a rendition.
	 *
	 * @param level rendition index, or `-1` for automatic selection
	 */
	selectLevel: (level: number) => void;
};

/** video caption tracks and selection. */
export type VideoSubtitles = {
	/** available tracks. */
	tracks: MediaPlaylist[];
	/** selected track, or `-1` when captions are off. */
	selectedTrack: number;
	/**
	 * selects a caption track.
	 *
	 * @param track track index, or `-1` to turn captions off
	 */
	selectTrack: (track: number) => void;
};

export function SettingsMenu({
	quality,
	subtitles,
	onOpenChange,
	fullscreenContainer,
}: {
	quality: VideoQuality;
	subtitles: VideoSubtitles;
	onOpenChange: (open: boolean) => void;
	/** portal target while fullscreen. */
	fullscreenContainer?: React.RefObject<HTMLElement | null>;
}) {
	const hasQualityChoice = quality.levels.length > 1;
	const hasSubtitleChoice = subtitles.tracks.length > 0;
	if (!hasQualityChoice && !hasSubtitleChoice) {
		return null;
	}

	const label = m['components.post.video.settings.label']();
	const activeLevel = quality.selectedLevel === -1 ? quality.levels[quality.activeLevel] : undefined;
	const autoLabel = activeLevel
		? m['components.post.video.quality.autoActive']({ quality: formatQualityLabel(activeLevel) })
		: m['components.post.video.quality.auto']();
	const offLabel = m['common.status.off']();

	return (
		<Menu.Root onOpenChange={onOpenChange}>
			<Menu.Trigger className={clsx(controlButtonStyles.button, styles.trigger)} aria-label={label}>
				<SettingsGearIcon className={controlButtonStyles.icon} aria-hidden />
			</Menu.Trigger>
			<Menu.Popup label={label} align="end" side="top" minWidth={170} container={fullscreenContainer}>
				{hasQualityChoice && (
					<Menu.Group>
						<Menu.LabelText>{m['components.post.video.quality.label']()}</Menu.LabelText>
						<Menu.Item
							label={m['components.post.video.quality.auto']()}
							onClick={() => {
								quality.selectLevel(-1);
							}}
						>
							<Menu.ItemText>{autoLabel}</Menu.ItemText>
							<Menu.ItemRadio selected={quality.selectedLevel === -1} />
						</Menu.Item>
						{quality.levels
							.map((level, index) => {
								const levelLabel = formatQualityLabel(level);
								return (
									<Menu.Item
										key={level.url[0]}
										label={levelLabel}
										onClick={() => {
											quality.selectLevel(index);
										}}
									>
										<Menu.ItemText>{levelLabel}</Menu.ItemText>
										<Menu.ItemRadio selected={quality.selectedLevel === index} />
									</Menu.Item>
								);
							})
							.toReversed()}
					</Menu.Group>
				)}
				{hasQualityChoice && hasSubtitleChoice && <Menu.Separator />}
				{hasSubtitleChoice && (
					<Menu.Group>
						<Menu.LabelText>{m['components.post.video.captions.label']()}</Menu.LabelText>
						<Menu.Item
							label={offLabel}
							onClick={() => {
								subtitles.selectTrack(-1);
							}}
						>
							<Menu.ItemText>{offLabel}</Menu.ItemText>
							<Menu.ItemRadio selected={subtitles.selectedTrack === -1} />
						</Menu.Item>
						{subtitles.tracks.map((track, index) => {
							const trackLabel = formatTrackLabel(track, index);
							return (
								<Menu.Item
									key={track.url}
									label={trackLabel}
									onClick={() => {
										subtitles.selectTrack(index);
									}}
								>
									<Menu.ItemText>{trackLabel}</Menu.ItemText>
									<Menu.ItemRadio selected={subtitles.selectedTrack === index} />
								</Menu.Item>
							);
						})}
					</Menu.Group>
				)}
			</Menu.Popup>
		</Menu.Root>
	);
}

function formatQualityLabel(level: Level): string {
	if (level.height) {
		return `${level.height}p`;
	}
	// use bitrate when resolution is unavailable
	return `${Math.round(level.bitrate / 1000)}k`;
}

// prefer localized language names over manifest names
function formatTrackLabel(track: MediaPlaylist, index: number): string {
	if (track.lang) {
		return codeToLanguageName(track.lang, LOCALE);
	}
	if (track.name) {
		return track.name;
	}
	return m['components.post.video.captions.unnamedTrack']({ number: index + 1 });
}
