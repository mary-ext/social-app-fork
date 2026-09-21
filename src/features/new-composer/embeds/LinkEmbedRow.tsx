import { memo } from 'react';

import type { Wordgard } from 'wordgard/editor';

import type { PostEmbeds } from './link-embeds';
import { LinkCard } from './LinkCard';
import * as styles from './LinkEmbedRow.css';

/**
 * previews of the links a post embeds.
 *
 * @param props the editor, the post's embeds, and whether their controls are tabbable
 * @returns the row, or null if the post embeds no links
 */
export const LinkEmbedRow = memo(function LinkEmbedRow({
	wg,
	embeds,
	isActive,
}: {
	wg: Wordgard;
	embeds: PostEmbeds;
	isActive: boolean;
}) {
	if (!embeds.external && !embeds.record) {
		return null;
	}

	// media slot first, like a published record-with-media embed.
	return (
		<div className={styles.root}>
			{embeds.external && (
				<LinkCard key={embeds.external} wg={wg} url={embeds.external} kind="external" isActive={isActive} />
			)}
			{embeds.record && (
				<LinkCard key={embeds.record} wg={wg} url={embeds.record} kind="record" isActive={isActive} />
			)}
		</div>
	);
});
