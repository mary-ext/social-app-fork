import type { LinkMeta } from '#/lib/link-meta/link-meta';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { EmbedThumb } from '#/components/EmbedThumb';
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

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
							<GlobeIcon fill={colors.textContrastLow} size="xs" />
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
