import { useMemo } from 'react';
import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { exemptExternalEmbedSources, parseEmbedPlayerFromUrl } from '#/lib/strings/embed-player';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { useExternalEmbedsPrefs } from '#/state/preferences';

import { ExternalGif } from '#/components/ExternalEmbed/ExternalGif';
import { ExternalPlayer } from '#/components/ExternalEmbed/ExternalPlayer';
import { GifEmbed } from '#/components/ExternalEmbed/GifEmbed';
import { Earth_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { Text } from '#/components/Text';

import * as styles from './index.css';

export type ExternalEmbedProps = {
	link: AppBskyEmbedExternal.ViewExternal;
	onOpen?: () => void;
	hideAlt?: boolean;
};

/** Web-native external embed: a plain link card, an embedded gif/iframe player, or an autoplaying gif. */
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

	// the anchor opens the external link via default nav; an ancestor `BlockLink` ignores clicks that land on
	// it (it's a real <a>), so we only need to fire the open-interaction callback here.
	const onClick = () => {
		onOpen?.();
	};

	const ariaLabel = link.title || l`Open link to ${niceUrl}`;

	// Autoplaying tenor/klipy gifs render standalone, without the card chrome.
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

	// Giphy gifs + iframe players render inside the card, but the media slot owns its own press (play); only
	// the body navigates. So the card is a plain `<div>` and the body is the `<a>` (not the whole card).
	if (embedPlayerParams) {
		const hideTitle = !!embedPlayerParams.isGif || !!embedPlayerParams.dimensions;
		return (
			<div className={styles.wrapper}>
				<div className={styles.card}>
					{embedPlayerParams.isGif ? (
						<ExternalGif link={link} params={embedPlayerParams} />
					) : (
						<ExternalPlayer link={link} params={embedPlayerParams} />
					)}
					<a
						className={clsx(styles.body, styles.bodyWithMedia, styles.bodyLink)}
						href={link.uri}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={ariaLabel}
						onClick={onClick}
					>
						<CardBody link={link} niceUrl={niceUrl} hideTitle={hideTitle} />
					</a>
				</div>
			</div>
		);
	}

	// Plain link card — the whole card is the link.
	return (
		<div className={styles.wrapper}>
			<a
				className={styles.card}
				href={link.uri}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={ariaLabel}
				onClick={onClick}
			>
				{imageUri ? <img className={styles.thumb} src={imageUri} alt="" loading="lazy" /> : null}
				<div className={clsx(styles.body, imageUri && styles.bodyWithMedia)}>
					<CardBody link={link} niceUrl={niceUrl} />
				</div>
			</a>
		</div>
	);
}

function CardBody({
	hideTitle,
	link,
	niceUrl,
}: {
	hideTitle?: boolean;
	link: AppBskyEmbedExternal.ViewExternal;
	niceUrl: string;
}) {
	return (
		<>
			<div className={styles.titleBlock}>
				{!hideTitle ? (
					<Text size="md" weight="semiBold" leading="snug" numberOfLines={3}>
						{link.title || link.uri}
					</Text>
				) : null}
				{link.description ? (
					<Text size="sm" leading="snug" numberOfLines={link.thumb ? 2 : 4}>
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
		</>
	);
}
