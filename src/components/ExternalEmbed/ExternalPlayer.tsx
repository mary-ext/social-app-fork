import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import { type EmbedPlayerParams, getPlayerAspect } from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs } from '#/state/preferences';

import { noRowLink } from '#/components/BlockLink';
import { EmbedConsentDialog } from '#/components/dialogs/EmbedConsent';
import { EmbedThumb } from '#/components/EmbedThumb';
import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Spinner } from '#/components/Spinner';
import { useDialogHandle } from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as styles from './ExternalPlayer.css';

export type ExternalPlayerProps = {
	link: AppBskyEmbedExternal.ViewExternal;
	params: EmbedPlayerParams;
};

/** Click-to-play iframe embed (youtube/vimeo/spotify/…): thumbnail + play overlay until activated. */
export function ExternalPlayer({ link, params }: ExternalPlayerProps) {
	const externalEmbedsPrefs = useExternalEmbedsPrefs();
	const consentDialogHandle = useDialogHandle();
	const containerRef = useRef<HTMLDivElement>(null);

	const [isActive, setIsActive] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const aspect = getPlayerAspect({
		type: params.type,
		hasThumb: !!link.thumb,
		width: window.innerWidth,
	});

	// deactivate when scrolled out of the viewport, so twitch/youtube audio doesn't continue off-screen.
	useEffect(() => {
		if (!isActive) {
			return;
		}
		const el = containerRef.current;
		if (!el) {
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) {
					setIsActive(false);
				}
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [isActive]);

	const onPlayPress = useCallback(() => {
		if (externalEmbedsPrefs?.[params.source] === undefined) {
			consentDialogHandle.open(null);
			return;
		}
		setIsActive(true);
	}, [consentDialogHandle, externalEmbedsPrefs, params.source]);

	const showThumb = !!link.thumb && (!isActive || isLoading);

	return (
		<>
			<EmbedConsentDialog
				handle={consentDialogHandle}
				source={params.source}
				onAccept={() => setIsActive(true)}
			/>
			<div
				ref={containerRef}
				className={styles.container}
				style={
					aspect.aspectRatio ? { aspectRatio: String(aspect.aspectRatio) } : { height: `${aspect.height}px` }
				}
			>
				{showThumb ? <EmbedThumb frameClassName={styles.thumb} src={link.thumb} /> : null}
				{!isActive || isLoading ? <div aria-hidden className={styles.dim} /> : null}
				{!isActive || isLoading ? (
					<button
						type="button"
						className={styles.overlay}
						aria-label={m['components.post.video.a11y.play']()}
						onClick={onPlayPress}
					>
						{!isActive ? <PlayButtonIcon /> : <Spinner label={m['common.video.loading']()} />}
					</button>
				) : null}
				{isActive ? (
					<div className={styles.iframeWrap} {...noRowLink}>
						{/*
						 * keying on the src remounts the iframe for a new embed rather than navigating the existing one.
						 * `allow="autoplay"` delegates the autoplay policy to the cross-origin frame, otherwise the
						 * browser ignores the `autoplay=1` in the player URL (default allowlist is `self`).
						 */}
						<iframe
							key={params.playerUri}
							className={styles.iframe}
							src={params.playerUri}
							onLoad={() => setIsLoading(false)}
							allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
							allowFullScreen
							title={link.title || m['components.post.external.a11y.player']()}
						/>
					</div>
				) : null}
			</div>
		</>
	);
}
