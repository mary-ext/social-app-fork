import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { toNiceDomain } from '#/lib/links/nice-domain';
import { parseGifEmbedFromUrl } from '#/lib/media/gif-embed';

import { EmbedThumb } from '#/components/EmbedThumb';
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

export function ExternalEmbed({ link, onOpen, hideAlt, className }: ExternalEmbedProps) {
	const navigationDisabled = useNavigationDisabled();

	const gifParams = parseGifEmbedFromUrl(link.uri);
	if (gifParams) {
		const parsedAlt = parseAltFromGIFDescription(link.description);
		return (
			<GifEmbed
				params={gifParams}
				thumb={link.thumb ?? null}
				altText={parsedAlt.alt}
				isPreferredAltText={parsedAlt.isPreferred}
				hideAlt={hideAlt}
				className={className}
			/>
		);
	}

	const niceUrl = toNiceDomain(link.uri);

	const anchorProps = navigationDisabled
		? undefined
		: {
				'aria-label': link.title || m['common.a11y.openLink']({ niceUrl }),
				href: link.uri,
				onClick: onOpen,
				rel: 'noopener noreferrer',
				target: '_blank',
			};

	return (
		<a className={clsx(styles.card({ interactive: !navigationDisabled }), className)} {...anchorProps}>
			{link.thumb ? <EmbedThumb src={link.thumb} /> : null}
			<div className={clsx(styles.body, link.thumb && styles.bodyWithMedia)}>
				<div className={styles.titleBlock}>
					<Text size="md" weight="semiBold" numberOfLines={3}>
						{link.title || link.uri}
					</Text>
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
			</div>
		</a>
	);
}
