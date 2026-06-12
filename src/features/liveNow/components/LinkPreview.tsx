import { useState } from 'react';
import { Trans } from '@lingui/react/macro';

import type { LinkMeta } from '#/lib/link-meta/link-meta';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Text } from '#/components/Text';

import * as styles from './LinkPreview.css';

export function LinkPreview({ linkMeta, loading }: { linkMeta?: LinkMeta; loading: boolean }) {
	// tracks the src that failed to load; a different src re-attempts (no effect needed to reset)
	const [erroredSrc, setErroredSrc] = useState<string>();

	if (!linkMeta && !loading) {
		return null;
	}

	const showImage = !!linkMeta?.image && erroredSrc !== linkMeta.image;

	return (
		<div className={styles.card}>
			<div className={styles.thumb}>
				{showImage && (
					<img
						alt=""
						className={styles.thumbImage}
						onError={() => setErroredSrc(linkMeta?.image)}
						src={linkMeta?.image}
					/>
				)}
				{linkMeta && !showImage && (
					<>
						<span className={styles.placeholderIcon}>
							<ImageIcon fill="currentColor" size="md" />
						</span>
						<Text align="center" color="textContrastLow" size="xs">
							<Trans>No image</Trans>
						</Text>
					</>
				)}
			</div>
			<div className={styles.body}>
				{linkMeta ? (
					<>
						<Text leading="snug" numberOfLines={2} size="md" weight="semiBold">
							{linkMeta.title || linkMeta.url}
						</Text>
						<div className={styles.domainRow}>
							<span className={styles.globe}>
								<GlobeIcon fill="currentColor" size="xs" />
							</span>
							<Text color="textContrastMedium" leading="snug" numberOfLines={1} size="xs">
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
