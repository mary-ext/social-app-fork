import type { LinkMeta } from '#/lib/link-meta';
import { toNiceDomain } from '#/lib/url';

import { EmbedThumb } from '#/components/EmbedThumb';
import { Text } from '#/components/Text';

import GlobeIcon from '#/icons/central/Globe_round_outlined_radius1_stroke2.svg';

import * as styles from './LinkPreview.css';

export function LinkPreview({ linkMeta, loading }: { linkMeta?: LinkMeta; loading: boolean }) {
	if (!linkMeta && !loading) {
		return null;
	}

	return (
		<div className={styles.card}>
			{linkMeta ? (
				<EmbedThumb frameClassName={styles.thumb} src={linkMeta.image} />
			) : (
				<div className={styles.thumb} />
			)}
			<div className={styles.body}>
				{linkMeta ? (
					<>
						<Text numberOfLines={2} size="md" weight="semiBold">
							{linkMeta.title || linkMeta.url}
						</Text>
						<div className={styles.domainRow}>
							<GlobeIcon className={styles.globeIcon} />
							<Text color="textContrastMedium" numberOfLines={1} size="xs">
								{toNiceDomain(linkMeta.url)}
							</Text>
						</div>
					</>
				) : (
					<>
						<div className={styles.skeletonTitle} />
						<div className={styles.skeletonDomain} />
					</>
				)}
			</div>
		</div>
	);
}
