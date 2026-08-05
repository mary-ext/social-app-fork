import type { Rendition } from '#/lib/media/hls/protocol';
import type { SubtitleTrack } from '#/lib/media/hls/subtitles';

import { codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import * as Menu from '#/components/Menu';

import SettingsGearIcon from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ControlButton } from './ControlButton';

export type VideoQuality = {
	/** available renditions. */
	renditions: Rendition[];
	/** selected rendition, or `-1` before loading. */
	selected: number;
	/**
	 * selects a video rendition.
	 *
	 * @param index rendition index
	 */
	select: (index: number) => void;
};

export type VideoSubtitles = {
	/** available tracks. */
	tracks: SubtitleTrack[];
	/** selected track, or `-1` when captions are off. */
	selectedTrack: number;
	/**
	 * selects a subtitle track.
	 *
	 * @param track track index, or `-1` to disable subtitles
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
	const hasQualityChoice = quality.renditions.length > 1;
	const hasSubtitleChoice = subtitles.tracks.length > 0;
	if (!hasQualityChoice && !hasSubtitleChoice) {
		return null;
	}

	const label = m['components.post.video.settings.label']();
	const offLabel = m['common.status.off']();

	return (
		<Menu.Root onOpenChange={onOpenChange}>
			<Menu.Trigger
				render={
					<ControlButton icon={SettingsGearIcon} label={label} tooltipContainer={fullscreenContainer} />
				}
			/>
			<Menu.Popup label={label} align="end" side="top" minWidth={170} container={fullscreenContainer}>
				{hasQualityChoice && (
					<Menu.Group>
						<Menu.LabelText>{m['components.post.video.quality.label']()}</Menu.LabelText>
						{quality.renditions
							.map((rendition) => {
								const renditionLabel = formatQualityLabel(rendition);
								return (
									<Menu.Item
										key={rendition.index}
										label={renditionLabel}
										onClick={() => {
											quality.select(rendition.index);
										}}
									>
										<Menu.ItemText>{renditionLabel}</Menu.ItemText>
										<Menu.ItemRadio selected={quality.selected === rendition.index} />
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
									key={track.id}
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

function formatQualityLabel(rendition: Rendition): string {
	if (rendition.height) {
		return `${rendition.height}p`;
	}
	return `${Math.round((rendition.bitrate ?? 0) / 1000)}k`;
}

// prefer localized language names over manifest names
function formatTrackLabel(track: SubtitleTrack, index: number): string {
	if (track.language) {
		return codeToLanguageName(track.language, LOCALE);
	}
	if (track.label) {
		return track.label;
	}
	return m['components.post.video.captions.unnamedTrack']({ number: index + 1 });
}
