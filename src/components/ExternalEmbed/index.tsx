import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { exemptExternalEmbedSources, parseEmbedPlayerFromUrl } from '#/lib/strings/embed-player';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { useExternalEmbedsPrefs } from '#/state/preferences/external-embeds';

import { EmbedThumb } from '#/components/EmbedThumb';
import { ExternalGif } from '#/components/ExternalEmbed/ExternalGif';
import { ExternalPlayer } from '#/components/ExternalEmbed/ExternalPlayer';
import { GifEmbed } from '#/components/ExternalEmbed/GifEmbed';
import { useNavigationDisabled } from '#/components/NavigationDisabled';
import { Text } from '#/components/Text';

import Globe from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './index.css';

export type ExternalEmbedProps = {
	link: AppBskyEmbedExternal.ViewExternal;
	onOpen?: () => void;
	hideAlt?: boolean;
	className?: string;
};

/** Web-native external embed: a plain link card, an embedded gif/iframe player, or an autoplaying gif. */
export function ExternalEmbed({ link, onOpen, hideAlt, className }: ExternalEmbedProps) {
	const externalEmbedPrefs = useExternalEmbedsPrefs();
	const navigationDisabled = useNavigationDisabled();
	const niceUrl = toNiceDomain(link.uri);
	const imageUri = link.thumb;

	let embedPlayerParams;
	const params = parseEmbedPlayerFromUrl(link.uri);
	if (params) {
		const canShow = externalEmbedPrefs?.[params.source] !== 'hide';
		if (canShow || exemptExternalEmbedSources.has(params.source)) {
			embedPlayerParams = params;
		}
	}

	// the anchor opens the external link via default nav; an ancestor `BlockLink` ignores clicks that land on
	// it (it's a real <a>), so we only need to fire the open-interaction callback here.
	const onClick = () => {
		onOpen?.();
	};

	const ariaLabel = link.title || m['common.a11y.openLink']({ niceUrl });

	// keep raw anchors so link cards always open in a new tab
	const anchorProps = navigationDisabled
		? undefined
		: {
				'aria-label': ariaLabel,
				href: link.uri,
				onClick,
				rel: 'noopener noreferrer',
				target: '_blank',
			};

	// Autoplaying tenor/klipy gifs render standalone, without the card chrome.
	if (embedPlayerParams?.source === 'tenor' || embedPlayerParams?.source === 'klipy') {
		const parsedAlt = parseAltFromGIFDescription(link.description);
		return (
			<GifEmbed
				params={embedPlayerParams}
				thumb={link.thumb ?? null}
				altText={parsedAlt.alt}
				isPreferredAltText={parsedAlt.isPreferred}
				hideAlt={hideAlt}
				className={className}
			/>
		);
	}

	// Giphy gifs + iframe players render inside the card, but the media slot owns its own press (play); only
	// the body navigates. So the card is a plain `<div>` and the body is the `<a>` (not the whole card).
	if (embedPlayerParams) {
		const hideTitle = !!embedPlayerParams.isGif || !!embedPlayerParams.dimensions;
		return (
			<div className={clsx(styles.card({ interactive: !navigationDisabled }), className)}>
				{embedPlayerParams.isGif ? (
					<ExternalGif link={link} params={embedPlayerParams} />
				) : (
					<ExternalPlayer link={link} params={embedPlayerParams} />
				)}
				<a className={clsx(styles.body, styles.bodyWithMedia, styles.bodyLink)} {...anchorProps}>
					<CardBody link={link} niceUrl={niceUrl} hideTitle={hideTitle} />
				</a>
			</div>
		);
	}

	// Plain link card — the whole card is the link.
	return (
		<a className={clsx(styles.card({ interactive: !navigationDisabled }), className)} {...anchorProps}>
			{imageUri ? <EmbedThumb src={imageUri} /> : null}
			<div className={clsx(styles.body, imageUri && styles.bodyWithMedia)}>
				<CardBody link={link} niceUrl={niceUrl} />
			</div>
		</a>
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
					<Text size="md" weight="semiBold" numberOfLines={3}>
						{link.title || link.uri}
					</Text>
				) : null}
				{link.description ? (
					<Text size="md_sub" numberOfLines={link.thumb ? 2 : 4}>
						{link.description}
					</Text>
				) : null}
			</div>
			<div className={styles.domainWrap}>
				<div className={styles.divider} />
				<div className={styles.domainRow}>
					<Globe className={styles.globe} />
					<Text size="xs" numberOfLines={1} className={styles.domain}>
						{niceUrl}
					</Text>
				</div>
			</div>
		</>
	);
}
