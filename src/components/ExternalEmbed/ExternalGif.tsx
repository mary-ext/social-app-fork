import { useCallback, useState } from 'react';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import type { EmbedPlayerParams } from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs } from '#/state/preferences';

import { EmbedConsentDialog } from '#/components/dialogs/EmbedConsent';
import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Spinner } from '#/components/Spinner';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as styles from './ExternalGif.css';

export type ExternalGifProps = {
	link: AppBskyEmbedExternal.ViewExternal;
	params: EmbedPlayerParams;
};

/** Click-to-play giphy gif: swaps a static thumbnail for the animated source on activation. */
export function ExternalGif({ link, params }: ExternalGifProps) {
	const externalEmbedsPrefs = useExternalEmbedsPrefs();
	const consentDialogHandle = Dialog.useDialogHandle();

	const [isPlayerActive, setIsPlayerActive] = useState(false);
	const [isPrefetched, setIsPrefetched] = useState(false);
	const [isAnimating, setIsAnimating] = useState(true);

	const load = useCallback(() => {
		setIsPlayerActive(true);
		const image = new window.Image();
		image.onload = () => setIsPrefetched(true);
		image.src = params.playerUri;
	}, [params.playerUri]);

	const onPlayPress = useCallback(() => {
		if (externalEmbedsPrefs?.[params.source] === undefined) {
			consentDialogHandle.open(null);
			return;
		}
		if (!isPlayerActive) {
			load();
			return;
		}
		setIsAnimating((prev) => !prev);
	}, [consentDialogHandle, externalEmbedsPrefs, isPlayerActive, load, params.source]);

	// while paused or not yet prefetched the static thumb stands in for the animation (web can't pause a gif).
	const showOverlay = !isPrefetched || !isAnimating;
	const src = showOverlay ? link.thumb : params.playerUri;

	return (
		<>
			<EmbedConsentDialog handle={consentDialogHandle} source={params.source} onAccept={load} />
			<button
				type="button"
				className={styles.button}
				aria-label={m['components.post.external.a11y.play']({ title: link.title })}
				onClick={onPlayPress}
			>
				<img className={styles.image} src={src} alt={link.title} />
				{showOverlay ? (
					<span className={styles.overlay}>
						<span aria-hidden className={styles.dim} />
						{!isAnimating || !isPlayerActive ? (
							<PlayButtonIcon />
						) : (
							<Spinner label={m['common.gif.loading']()} />
						)}
					</span>
				) : null}
			</button>
		</>
	);
}
