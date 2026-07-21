import type { AppBskyActorDefs, AppBskyRichtextFacet } from '@atcute/bluesky';
import { type KeywordFilter, KeywordFilterFlags } from '@atcute/bluesky-moderation';

import { mapDefined } from '@mary/array-fns';

/**
 * checks whether text (with optional facets/tags and an author) matches any keyword filter.
 *
 * @param params the muted-word check inputs.
 * @param params.keywordFilters the interpreted keyword filters.
 * @param params.text the post text to test against content-targeted filters.
 * @param params.facets richtext facets whose tag features contribute to the tag set.
 * @param params.outlineTags additional tags carried outside the richtext facets.
 * @param params.actor the post author, used to honor the `exclude-following` target.
 * @returns whether any keyword filter matched.
 */
export const hasMutedWord = ({
	actor,
	facets,
	keywordFilters,
	outlineTags,
	text,
}: {
	actor?: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewBasic;
	facets?: AppBskyRichtextFacet.Main[];
	keywordFilters: KeywordFilter[];
	outlineTags?: string[];
	text: string;
}): boolean => {
	if (keywordFilters.length === 0) {
		return false;
	}

	const tags = [
		...(outlineTags ?? []),
		...mapDefined(
			(facets ?? []).flatMap((facet) => facet.features),
			(feature) => {
				if (feature.$type === 'app.bsky.richtext.facet#tag') {
					return feature.tag;
				}
			},
		),
	];

	const isFollowing = !!actor?.viewer?.following;
	const now = Date.now();

	for (const filter of keywordFilters) {
		if (filter.expiresAt !== undefined && filter.expiresAt < now) {
			continue;
		}
		if (filter.flags & KeywordFilterFlags.NoFollowing && isFollowing) {
			continue;
		}
		// a content-targeted filter applies to tags too, not just tag-targeted filters
		if (
			filter.flags & (KeywordFilterFlags.ApplyContent | KeywordFilterFlags.ApplyTopic) &&
			tags.some((tag) => filter.pattern.test(tag))
		) {
			return true;
		}
		if (filter.flags & KeywordFilterFlags.ApplyContent && filter.pattern.test(text)) {
			return true;
		}
	}

	return false;
};
