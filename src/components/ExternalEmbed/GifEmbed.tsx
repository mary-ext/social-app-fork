import { useEffect, useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import type { EmbedPlayerParams } from '#/lib/strings/embed-player';

import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Prompt from '#/components/web/Prompt';

import { useAutoplayDisabled } from '#/storage/hooks/autoplay';

import * as styles from './GifEmbed.css';

export type GifEmbedProps = {
	params: EmbedPlayerParams;
	thumb: string | undefined;
	altText: string;
	isPreferredAltText: boolean;
	hideAlt?: boolean;
};

/** Autoplaying GIF (tenor/klipy), rendered as a muted looping `<video>` with play/pause + GIF/ALT badges. */
export function GifEmbed({ params, thumb, altText, isPreferredAltText, hideAlt }: GifEmbedProps) {
	const { t: l } = useLingui();
	const [autoplayDisabled] = useAutoplayDisabled();
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState(!autoplayDisabled);
	const [isLoaded, setIsLoaded] = useState(false);

	// resume playback when the tab returns to the foreground.
	useEffect(() => {
		const onVisibilityChange = () => {
			const video = videoRef.current;
			if (document.visibilityState === 'visible' && !autoplayDisabled && video?.paused) {
				void video.play();
			}
		};
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => document.removeEventListener('visibilitychange', onVisibilityChange);
	}, [autoplayDisabled]);

	const onPress = () => {
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

	let aspectRatio = 1;
	if (params.dimensions) {
		const ratio = params.dimensions.width / params.dimensions.height;
		if (!Number.isNaN(ratio)) {
			aspectRatio = ratio;
		}
	}
	const constrained = Math.max(aspectRatio, 1 / 2);
	const pad = `${Math.min(1 / constrained, 1) * 100}%`;

	const useSources = !!params.playerSources && params.playerSources.length > 0;
	const resolvedAlt = !hideAlt && isPreferredAltText ? altText : undefined;

	return (
		<div className={styles.outer}>
			<div className={styles.sizer} style={assignInlineVars({ [styles.padVar]: pad })}>
				<div className={styles.abs}>
					<div className={styles.box} style={assignInlineVars({ [styles.ratioVar]: String(constrained) })}>
						<div className={styles.inset}>
							{!isPlaying && <div aria-hidden className={styles.dimInner} />}
							<button
								type="button"
								className={styles.playButton}
								aria-label={isPlaying ? l`Pause GIF` : l`Play GIF`}
								onClick={onPress}
							>
								{!isLoaded ? <Spinner label={l`Loading GIF`} /> : !isPlaying ? <PlayButtonIcon /> : null}
							</button>
							<div className={styles.gifBadge}>
								<Text size="xs" weight="bold" className={styles.badgeText}>
									<Trans>GIF</Trans>
								</Text>
							</div>
							{resolvedAlt ? <AltBadge text={resolvedAlt} /> : null}
							<video
								ref={videoRef}
								className={styles.video}
								src={useSources ? undefined : params.playerUri}
								poster={thumb}
								autoPlay={!autoplayDisabled ? true : undefined}
								preload={!autoplayDisabled ? 'auto' : undefined}
								playsInline
								loop
								muted
								aria-label={altText}
								onCanPlay={() => setIsLoaded(true)}
								onPlay={() => setIsPlaying(true)}
								onPause={() => setIsPlaying(false)}
							>
								{useSources
									? params.playerSources!.map((source) => (
											<source key={source.src} src={source.src} type={source.type} />
										))
									: null}
							</video>
							{!isPlaying && <div aria-hidden className={styles.dimOuter} />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function AltBadge({ text }: { text: string }) {
	const { t: l } = useLingui();
	const handle = Prompt.usePromptHandle();

	return (
		<>
			<button
				type="button"
				className={styles.altBadge}
				aria-label={l`Show alt text`}
				onClick={() => handle.open(null)}
			>
				<Text size="xs" weight="bold" className={styles.badgeText}>
					<Trans>ALT</Trans>
				</Text>
			</button>
			<Prompt.Outer handle={handle}>
				<Prompt.TitleText>
					<Trans>Alt Text</Trans>
				</Prompt.TitleText>
				<Prompt.DescriptionText>{text}</Prompt.DescriptionText>
				<Prompt.Actions>
					<Prompt.Action onPress={() => {}} cta={l`Close`} color="secondary" />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
