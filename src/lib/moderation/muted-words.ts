import { type AppBskyActorDefs, type AppBskyRichtextFacet } from '@atcute/bluesky';
import { interpretMutedWordPreference, KeywordFilterFlags } from '@atcute/bluesky-moderation';

/**
 * Checks whether text (with optional facets/tags/languages and an author) matches any muted word.
 *
 * Each muted word is interpreted into an @atcute keyword filter (a case-insensitive, whole-word regex plus
 * target/expiry flags) and tested against the post's content and tags.
 *
 * @param params the muted-word check inputs.
 * @param params.mutedWords the user's muted words.
 * @param params.text the post text to test against content-targeted filters.
 * @param params.facets richtext facets whose tag features contribute to the tag set.
 * @param params.outlineTags additional tags carried outside the richtext facets.
 * @param params.actor the post author, used to honor the `exclude-following` target.
 * @returns whether any muted word matched.
 */
export const hasMutedWord = ({
	actor,
	facets,
	mutedWords,
	outlineTags,
	text,
}: {
	actor?: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewBasic;
	facets?: AppBskyRichtextFacet.Main[];
	mutedWords: AppBskyActorDefs.MutedWord[];
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

	for (const mutedWord of mutedWords) {
		const filter = interpretMutedWordPreference(mutedWord);
		if (filter.expiresAt !== undefined && filter.expiresAt < now) {
			continue;
		}
		if (filter.flags & KeywordFilterFlags.NoFollowing && isFollowing) {
			continue;
		}
		if (filter.flags & KeywordFilterFlags.ApplyTopic && tags.some((tag) => filter.pattern.test(tag))) {
			return true;
		}
		if (filter.flags & KeywordFilterFlags.ApplyContent && filter.pattern.test(text)) {
			return true;
		}
	}

	return false;
};
