import {
	type ComponentPropsWithoutRef,
	type ComponentType,
	type ReactElement,
	type ReactNode,
	type SVGProps,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

import { CompositeItem, CompositeRoot } from '@base-ui/react/internals/composite';
import { Popover } from '@base-ui/react/popover';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getReducedMotion } from '#/lib/browser/reduced-motion';
import type { SubtitleTrack } from '#/lib/media/hls/client/subtitles';
import type { Rendition } from '#/lib/media/hls/shared/protocol';

import { codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import { useVideoSpeed } from '#/components/Post/Embed/VideoEmbed/video-speed';
import { Text } from '#/components/Text';
import { Tooltip } from '#/components/Tooltip';

import ChevronLeftIcon from '#/icons/central/ChevronLeft_round_outlined_radius1_stroke2.svg';
import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import ClosedCaptioningIcon from '#/icons/central/ClosedCaptioning_round_outlined_radius1_stroke2.svg';
import QualityIcon from '#/icons/central/SettingsSliderVer_round_outlined_radius1_stroke2.svg';
import SpeedIcon from '#/icons/central/SpeedHigh_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { menuInitialFocus, menuRowProps, useMenuNavigation } from './menu-navigation';
import { formatSpeedName, PlaybackSpeedPanel } from './PlaybackSpeedPanel';
import * as styles from './SettingsMenu.css';

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
	/**
	 * sets the vertical position for subtitle cues.
	 *
	 * @param line position as a percentage of the video height
	 */
	setCueLine: (line: number) => void;
};

type PanelId = 'main' | 'captions' | 'quality' | 'speed';

type PanelDirection = 'forward' | 'back';

type PanelState = {
	id: PanelId;
	direction?: PanelDirection;
	returnFocusTo?: PanelId;
};

const INITIAL_PANEL: PanelState = { id: 'main' };

export function SettingsMenu({
	render,
	tooltip,
	quality,
	subtitles,
	onOpenChange,
	fullscreenContainer,
}: {
	render: ReactElement;
	tooltip: string;
	quality: VideoQuality;
	subtitles: VideoSubtitles;
	onOpenChange: (open: boolean) => void;
	/** portal target while fullscreen. */
	fullscreenContainer?: React.RefObject<HTMLElement | null>;
}) {
	const [panel, setPanel] = useState(INITIAL_PANEL);
	// remount the panel when a closing popup reopens.
	const [openId, setOpenId] = useState(0);
	const panelRef = useRef<HTMLElement>(null);

	const hasQualityChoice = quality.renditions.length > 1;
	const hasSubtitleChoice = subtitles.tracks.length > 0;

	const label = m['components.post.video.settings.label']();
	const captionsLabel = m['components.post.video.captions.label']();
	const qualityLabel = m['components.post.video.quality.label']();
	const speedLabel = m['components.post.video.speed.label']();
	const offLabel = m['common.status.off']();

	const selectedRendition = quality.renditions.find((rendition) => rendition.index === quality.selected);
	const selectedTrack = subtitles.tracks[subtitles.selectedTrack];

	const openPanel = (id: PanelId) => {
		setPanel({ id, direction: 'forward' });
	};

	const goBack = () => {
		setPanel({ id: 'main', direction: 'back', returnFocusTo: panel.id });
	};

	const rowProps = (target: PanelId) => ({
		active: panel.returnFocusTo === target,
		onOpen: () => {
			openPanel(target);
		},
	});

	const renderPanel = () => {
		switch (panel.id) {
			case 'main': {
				return (
					<>
						{hasSubtitleChoice && (
							<Row
								icon={ClosedCaptioningIcon}
								label={captionsLabel}
								value={selectedTrack ? formatTrackLabel(selectedTrack, subtitles.selectedTrack) : offLabel}
								{...rowProps('captions')}
							/>
						)}
						<SpeedRow label={speedLabel} {...rowProps('speed')} />
						{hasQualityChoice && (
							<Row
								icon={QualityIcon}
								label={qualityLabel}
								value={selectedRendition && formatQualityLabel(selectedRendition)}
								{...rowProps('quality')}
							/>
						)}
					</>
				);
			}
			case 'captions': {
				return (
					<OptionPanel title={captionsLabel} onBack={goBack}>
						<Option
							label={offLabel}
							selected={subtitles.selectedTrack === -1}
							onBack={goBack}
							onClick={() => {
								subtitles.selectTrack(-1);
								goBack();
							}}
						/>
						{subtitles.tracks.map((track, index) => (
							<Option
								key={track.id}
								label={formatTrackLabel(track, index)}
								selected={subtitles.selectedTrack === index}
								onBack={goBack}
								onClick={() => {
									subtitles.selectTrack(index);
									goBack();
								}}
							/>
						))}
					</OptionPanel>
				);
			}
			case 'quality': {
				return (
					<OptionPanel title={qualityLabel} onBack={goBack}>
						{quality.renditions
							.map((rendition) => (
								<Option
									key={rendition.index}
									label={formatQualityLabel(rendition)}
									selected={quality.selected === rendition.index}
									onBack={goBack}
									onClick={() => {
										quality.select(rendition.index);
										goBack();
									}}
								/>
							))
							.toReversed()}
					</OptionPanel>
				);
			}
			case 'speed': {
				return (
					<>
						<PanelHeader title={speedLabel} onBack={goBack} />
						<PlaybackSpeedPanel />
					</>
				);
			}
		}
	};

	return (
		<Popover.Root
			modal
			onOpenChange={(nextOpen, eventDetails) => {
				if (!nextOpen && eventDetails.reason === 'escape-key' && panel.id !== 'main') {
					eventDetails.cancel();
					goBack();
					return;
				}

				if (nextOpen) {
					setPanel(INITIAL_PANEL);
					setOpenId((id) => id + 1);
				}

				onOpenChange(nextOpen);
			}}
		>
			<Tooltip label={tooltip} container={fullscreenContainer}>
				<Popover.Trigger render={render} />
			</Tooltip>
			<Popover.Portal className={styles.portal} container={fullscreenContainer}>
				<Popover.Positioner side="top" align="end" sideOffset={6} collisionPadding={6}>
					<Popover.Popup
						className={styles.popup}
						aria-label={label}
						initialFocus={(openType) => menuInitialFocus(panelRef.current, openType)}
					>
						<PanelViewport>
							<Panel key={`${openId}:${panel.id}`} ref={panelRef} direction={panel.direction}>
								{renderPanel()}
							</Panel>
						</PanelViewport>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

function PanelViewport({ children }: { children: ReactNode }) {
	const contentRef = useRef<HTMLDivElement>(null);
	const measuredRef = useRef<number>(undefined);
	const [height, setHeight] = useState<number>();
	const [transitioning, setTransitioning] = useState(false);

	useLayoutEffect(() => {
		const content = contentRef.current;
		if (!content) {
			return;
		}

		const observer = new ResizeObserver(() => {
			const next = content.offsetHeight;
			const measured = measuredRef.current;
			measuredRef.current = next;

			// reduced motion does not emit transitionend.
			if (measured !== undefined && measured !== next && !getReducedMotion()) {
				setTransitioning(true);
			}
			setHeight(next);
		});
		observer.observe(content);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			className={styles.viewport}
			data-transitioning={transitioning || undefined}
			style={height !== undefined ? assignInlineVars({ [styles.panelHeightVar]: `${height}px` }) : undefined}
			onTransitionEnd={(event) => {
				if (event.target === event.currentTarget && event.propertyName === 'height') {
					setTransitioning(false);
				}
			}}
		>
			<div ref={contentRef}>{children}</div>
		</div>
	);
}

function Panel({
	ref,
	direction,
	children,
}: {
	ref: React.RefObject<HTMLElement | null>;
	direction?: PanelDirection;
	children: ReactNode;
}) {
	const { compositeProps, rootProps } = useMenuNavigation(ref, {
		navigated: direction !== undefined,
	});

	return (
		<CompositeRoot
			className={styles.panel}
			orientation="vertical"
			loopFocus
			enableHomeAndEndKeys
			{...compositeProps}
			rootRef={ref}
			props={[rootProps, { 'data-direction': direction }]}
		>
			{children}
		</CompositeRoot>
	);
}

// #region rows

function MenuRow({
	active = false,
	onBack,
	onOpen,
	children,
	...props
}: {
	active?: boolean;
	onBack?: () => void;
	onOpen?: () => void;
	children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'button'>, 'onKeyDown'>) {
	return (
		<CompositeItem
			render={
				<button
					type="button"
					className={styles.row}
					{...menuRowProps(active)}
					{...props}
					onKeyDown={(event) => {
						switch (event.key) {
							case 'ArrowLeft': {
								if (!onBack) {
									return;
								}
								event.preventDefault();
								onBack();
								break;
							}
							case 'ArrowRight': {
								if (!onOpen) {
									return;
								}
								event.preventDefault();
								onOpen();
								break;
							}
						}
					}}
				/>
			}
		>
			{children}
		</CompositeItem>
	);
}

function Row({
	icon: Icon,
	label,
	value,
	active,
	onOpen,
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	value?: string;
	active: boolean;
	onOpen: () => void;
}) {
	return (
		<MenuRow active={active} onOpen={onOpen} onClick={onOpen}>
			<Icon className={styles.rowIcon} aria-hidden />
			<Text size="md_sub" weight="medium" color="white" numberOfLines={1} className={styles.rowLabel}>
				{label}
			</Text>
			{value !== undefined && (
				<Text size="md_sub" weight="medium" numberOfLines={1} className={styles.rowValue}>
					{value}
				</Text>
			)}
			<ChevronRightIcon className={styles.rowChevron} aria-hidden />
		</MenuRow>
	);
}

function SpeedRow({ label, active, onOpen }: { label: string; active: boolean; onOpen: () => void }) {
	const speed = useVideoSpeed();

	return (
		<Row icon={SpeedIcon} label={label} value={formatSpeedName(speed)} active={active} onOpen={onOpen} />
	);
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
	return (
		<>
			<MenuRow onBack={onBack} aria-label={m['components.post.video.settings.back']()} onClick={onBack}>
				<ChevronLeftIcon className={styles.rowIcon} aria-hidden />
				<Text size="md_sub" weight="semiBold" color="white" numberOfLines={1} className={styles.rowLabel}>
					{title}
				</Text>
			</MenuRow>
			<hr className={styles.separator} />
		</>
	);
}

function OptionPanel({
	title,
	onBack,
	children,
}: {
	title: string;
	onBack: () => void;
	children: ReactNode;
}) {
	return (
		<>
			<PanelHeader title={title} onBack={onBack} />
			<div role="radiogroup" aria-label={title}>
				{children}
			</div>
		</>
	);
}

function Option({
	label,
	selected,
	onBack,
	onClick,
}: {
	label: string;
	selected: boolean;
	onBack: () => void;
	onClick: () => void;
}) {
	return (
		<MenuRow active={selected} onBack={onBack} role="radio" aria-checked={selected} onClick={onClick}>
			<Text size="md_sub" weight="medium" color="white" numberOfLines={1} className={styles.rowLabel}>
				{label}
			</Text>
			<span className={styles.rowRadio}>{selected && <span className={styles.rowRadioDot} />}</span>
		</MenuRow>
	);
}

// #endregion

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
