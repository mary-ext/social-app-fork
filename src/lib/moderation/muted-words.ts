import type { AppBskyActorDefs, AppBskyRichtextFacet } from '@atcute/bluesky';
import { type KeywordFilter, KeywordFilterFlags } from '@atcute/bluesky-moderation';

/**
 * Checks whether text (with optional facets/tags and an author) matches any keyword filter.
 *
 * Each filter is a case-insensitive, whole-word regex with target/expiry flags (see
 * `interpretMutedWordPreference`), tested against the post's content and tags.
 *
 * @param params the muted-word check inputs.
 * @param params.keywordFilters the interpreted keyword filters (e.g. `moderationOpts.prefs.keywordFilters`).
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
	const tags = [
		...(outlineTags ?? []),
		...(facets ?? []).flatMap((facet) =>
			facet.features
				.filter((feature) => feature.$type === 'app.bsky.richtext.facet#tag')
				.map((feature) => feature.tag),
		),
	];

	const isFollowing = Boolean(actor?.viewer?.following);
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
