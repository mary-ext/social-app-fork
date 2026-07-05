import { unwrapEmbed, type AppBskyFeedDefs, type AppBskyFeedPost } from '@atcute/bluesky';
import type { DisplayRestrictions, ModerationCause } from '@atcute/bluesky-moderation';

import { unique } from '#/lib/moderation';

import type { AppModerationCause } from '#/components/Pills';

export const POST_META_NO_CONTENT_OFFSET = { paddingTop: 8 };
export const POST_EMBED_NO_CONTENT_OFFSET = { paddingTop: 6 };

export function maybeApplyGalleryOffsetStyles(
	placement: 'meta' | 'embed',
	{
		post,
		modui,
		additionalCauses,
	}: {
		post: AppBskyFeedDefs.PostView;
		modui: DisplayRestrictions;
		additionalCauses?: ModerationCause[] | AppModerationCause[];
	},
) {
	const record = post.record as AppBskyFeedPost.Main;

	if (record.text) {
		return;
	}

	const { media } = unwrapEmbed(post.embed);

	let hasImages = false;
	if (media) {
		switch (media.$type) {
			case 'app.bsky.embed.images#view': {
				hasImages = media.images.length > 1;
				break;
			}
			case 'app.bsky.embed.gallery#view': {
				hasImages = media.items.length > 1;
				break;
			}
		}
	}

	if (!hasImages) {
		return;
	}

	let hasLabels = false;
	if (modui.alerts.length > 0) {
		hasLabels = modui.alerts.filter(unique).length > 0;
	}
	if (modui.informs.length > 0) {
		hasLabels = hasLabels || modui.informs.filter(unique).length > 0;
	}
	if (additionalCauses?.length) {
		hasLabels = true;
	}

	if (hasLabels) {
		return;
	}

	return placement === 'meta' ? POST_META_NO_CONTENT_OFFSET : POST_EMBED_NO_CONTENT_OFFSET;
}
