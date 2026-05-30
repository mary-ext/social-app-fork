import { type AppBskyFeedDefs, type AppBskyFeedPost } from '@atcute/bluesky';

import { unique } from '#/lib/moderation';
import { type ModerationUI } from '#/lib/moderation/compat';
import { type ModerationCause } from '#/lib/moderation/compat';

import { type AppModerationCause } from '#/components/Pills';

export const POST_META_NO_CONTENT_OFFSET = { paddingTop: 10 };
export const POST_EMBED_NO_CONTENT_OFFSET = { paddingTop: 6 };

export function maybeApplyGalleryOffsetStyles(
	placement: 'meta' | 'embed',
	{
		post,
		modui,
		additionalCauses,
	}: {
		post: AppBskyFeedDefs.PostView;
		modui: ModerationUI;
		additionalCauses?: ModerationCause[] | AppModerationCause[];
	},
) {
	const record = post.record as AppBskyFeedPost.Main;

	/*
	 * First check if we even have images
	 */
	const embed = record.embed;
	const isImageEmbed = embed?.$type === 'app.bsky.embed.images';
	const isRecordWithMedia = embed?.$type === 'app.bsky.embed.recordWithMedia';
	let hasImages = false;
	if (isImageEmbed) {
		// one image, not a gallery
		if (embed.images.length === 1) return;
		hasImages = true;
	}
	if (isRecordWithMedia) {
		if (embed.media.$type === 'app.bsky.embed.images') {
			// one image, not a gallery
			if (embed.media.images.length === 1) return;
		}
		hasImages = true;
	}
	if (!hasImages) return;

	/*
	 * Then check if we have any text
	 */
	let hasLabels = false;
	if (modui.alert) {
		hasLabels = modui.alerts.filter(unique).length > 0;
	}
	if (modui.inform) {
		hasLabels = hasLabels || modui.informs.filter(unique).length > 0;
	}
	if (additionalCauses?.length) {
		hasLabels = true;
	}

	/*
	 * If no text or labels, then we need a lil bump
	 */
	const shouldApplyOffset = !record.text && !hasLabels;

	return shouldApplyOffset
		? placement === 'meta'
			? POST_META_NO_CONTENT_OFFSET
			: POST_EMBED_NO_CONTENT_OFFSET
		: {};
}
