import { type MouseEvent, useMemo } from 'react';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { exemptExternalEmbedSources, parseEmbedPlayerFromUrl } from '#/lib/strings/embed-player';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { useExternalEmbedsPrefs } from '#/state/preferences';

import { atoms as a } from '#/alf';

import { Earth_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { ExternalEmbed as ExternalEmbedNative } from '#/components/Post/Embed/ExternalEmbed';
import { cx } from '#/components/web/cx';
import { GifEmbed } from '#/components/web/ExternalEmbed/GifEmbed';
import { Text } from '#/components/web/Text';

import * as styles from './index.css';

export type ExternalEmbedProps = {
	link: AppBskyEmbedExternal.ViewExternal;
	onOpen?: () => void;
	hideAlt?: boolean;
};

/** Web-native external link card. GIF/iframe-player embeds fall back to the RNW implementation. */
export function ExternalEmbed({ link, onOpen, hideAlt }: ExternalEmbedProps) {
	const { t: l } = useLingui();
	const externalEmbedPrefs = useExternalEmbedsPrefs();
	const niceUrl = toNiceDomain(link.uri);
	const imageUri = link.thumb;

	const embedPlayerParams = useMemo(() => {
		const params = parseEmbedPlayerFromUrl(link.uri);
		if (!params) {
			return;
		}
		const canShow = externalEmbedPrefs?.[params.source] !== 'hide';
		if (canShow || exemptExternalEmbedSources.has(params.source)) {
			return params;
		}
	}, [link.uri, externalEmbedPrefs]);

	// Autoplaying tenor/klipy gifs are web-native.
	if (embedPlayerParams?.source === 'tenor' || embedPlayerParams?.source === 'klipy') {
		const parsedAlt = parseAltFromGIFDescription(link.description);
		return (
			<div className={styles.wrapper}>
				<GifEmbed
					params={embedPlayerParams}
					thumb={link.thumb}
					altText={parsedAlt.alt}
					isPreferredAltText={parsedAlt.isPreferred}
					hideAlt={hideAlt}
				/>
			</div>
		);
	}

	// Other iframe players (youtube/vimeo/giphy/…) still fall back to the RNW implementation.
	if (embedPlayerParams) {
		return <ExternalEmbedNative link={link} onOpen={onOpen} style={a.mt_sm} hideAlt={hideAlt} />;
	}

	// Scope the press: the anchor opens the external link (default nav, new tab), but the click must not
	// bubble to an ancestor post's thread link and navigate in-app. RN's press responder scopes this for free.
	const onClick = (e: MouseEvent) => {
		e.stopPropagation();
		onOpen?.();
	};

	return (
		<div className={styles.wrapper}>
			<a
				className={styles.card}
				href={link.uri}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={link.title || l`Open link to ${niceUrl}`}
				onClick={onClick}
			>
				{imageUri ? <img className={styles.thumb} src={imageUri} alt="" loading="lazy" /> : null}
				<div className={cx(styles.body, imageUri && styles.bodyWithMedia)}>
					<div className={styles.titleBlock}>
						<Text size="md" weight="semiBold" leading="snug" numberOfLines={3}>
							{link.title || link.uri}
						</Text>
						{link.description ? (
							<Text size="sm" leading="snug" numberOfLines={imageUri ? 2 : 4}>
								{link.description}
							</Text>
						) : null}
					</div>
					<div className={styles.domainWrap}>
						<div className={styles.divider} />
						<div className={styles.domainRow}>
							<span className={styles.globe}>
								<Globe size="xs" fill="currentColor" />
							</span>
							<Text size="xs" leading="snug" numberOfLines={1} className={styles.domain}>
								{niceUrl}
							</Text>
						</div>
					</div>
				</div>
			</a>
		</div>
	);
}
