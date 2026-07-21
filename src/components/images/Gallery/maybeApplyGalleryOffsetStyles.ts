import { unwrapEmbed, type AppBskyFeedDefs } from '@atcute/bluesky';
import type { DisplayRestrictions, ModerationCause } from '@atcute/bluesky-moderation';

import { getPostRecord } from '#/lib/api/record-views';
import { unique } from '#/lib/moderation';

import type { AppModerationCause } from '#/components/Pills';

export const POST_META_NO_CONTENT_OFFSET = { paddingTop: 8 };
export const POST_EMBED_NO_CONTENT_OFFSET = { paddingTop: 6 };

export function maybeApplyGalleryOffsetStyles({
	additionalCauses,
	modui,
	post,
}: {
	additionalCauses?: ModerationCause[] | AppModerationCause[];
	modui: DisplayRestrictions;
	post: AppBskyFeedDefs.PostView;
}) {
	const record = getPostRecord(post);

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

	return {
		embed: POST_EMBED_NO_CONTENT_OFFSET,
		meta: POST_META_NO_CONTENT_OFFSET,
	};
}
