import { useEffect, useRef, useState } from 'react';

import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import { type EmbedPlayerParams, getPlayerAspect } from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs } from '#/state/preferences';

import { noRowLink } from '#/components/BlockLink';
import * as Dialog from '#/components/Dialog';
import { EmbedConsentDialog } from '#/components/dialogs/EmbedConsent';
import { EmbedThumb } from '#/components/EmbedThumb';
import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './ExternalPlayer.css';

export type ExternalPlayerProps = {
	link: AppBskyEmbedExternal.ViewExternal;
	params: EmbedPlayerParams;
};

/** Click-to-play iframe embed (youtube/vimeo/spotify/…): thumbnail + play overlay until activated. */
export function ExternalPlayer({ link, params }: ExternalPlayerProps) {
	const externalEmbedsPrefs = useExternalEmbedsPrefs();
	const consentDialogHandle = Dialog.useDialogHandle();
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

	const onPlayPress = () => {
		if (externalEmbedsPrefs?.[params.source] === undefined) {
			consentDialogHandle.open(null);
			return;
		}
		setIsActive(true);
	};

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
						 *
						 * the players need scripts, and their own origin's cookies/storage for playback and DRM —
						 * granting both is safe here only because every `playerUri` is cross-origin, so the frame
						 * cannot reach back in and drop its own sandbox. what stays revoked is what an embed has no
						 * business doing: navigating the top-level tab away, submitting forms, or downloading.
						 */}
						<iframe
							key={params.playerUri}
							className={styles.iframe}
							src={params.playerUri}
							onLoad={() => setIsLoading(false)}
							allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
							allowFullScreen
							// oxlint-disable-next-line react/iframe-missing-sandbox -- see above: the scripts/same-origin pair only defeats the sandbox for a same-origin frame
							sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
							title={link.title || m['components.post.external.a11y.player']()}
						/>
					</div>
				) : null}
			</div>
		</>
	);
}
