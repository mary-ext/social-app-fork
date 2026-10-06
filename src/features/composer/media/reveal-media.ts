import type { Wordgard } from 'wordgard/editor';

import { getMediaTileSelector, IMAGE_GROUP_ATTR } from '../shared/elements';

/**
 * scrolls an attachment's tile into view on the next animation frame, if present.
 *
 * @param wg the editor
 * @param mediaId the attachment's id
 */
export const revealMedia = (wg: Wordgard, mediaId: string): void => {
	requestAnimationFrame(() => {
		// search the container: attachment tiles live outside the editor.
		const tile = wg.dom.parentElement?.querySelector(getMediaTileSelector(mediaId));
		if (!tile) {
			return;
		}

		// in Firefox, 'nearest' can snap back to an earlier tile; use 'start' for clipped tiles.
		let inline: ScrollLogicalPosition = 'nearest';
		{
			const group = tile.closest(`[${IMAGE_GROUP_ATTR}]`);
			if (group) {
				const rect = tile.getBoundingClientRect();
				const bounds = group.getBoundingClientRect();
				// exclude the rail gutter from the visible bounds.
				const left = bounds.left + parseFloat(getComputedStyle(group).scrollPaddingLeft);
				if (rect.left < left || rect.right > bounds.right) {
					inline = 'start';
				}
			}
		}

		tile.scrollIntoView({ block: 'nearest', inline });
	});
};
