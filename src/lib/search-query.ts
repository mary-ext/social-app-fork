import type { AppBskyFeedSearchPostsV2 } from '@atcute/bluesky';
import { tokenize } from '@atcute/bluesky-search-parser';
import type { ActorIdentifier, Did, GenericUri } from '@atcute/lexicons';
import { isActorIdentifier, isGenericUri } from '@atcute/lexicons/syntax';

/** filter subset of `searchPostsV2` params. */
export type SearchPostsFilters = Pick<
	AppBskyFeedSearchPostsV2.$params,
	| 'authors'
	| 'domains'
	| 'excludeAuthors'
	| 'excludeDomains'
	| 'excludeHashtags'
	| 'excludeLanguages'
	| 'excludeMentions'
	| 'excludeReplies'
	| 'excludeUrls'
	| 'following'
	| 'hasMedia'
	| 'hasVideo'
	| 'hashtags'
	| 'languages'
	| 'mentions'
	| 'repliesOnly'
	| 'since'
	| 'until'
	| 'urls'
>;

export interface LiftedQuery {
	filters: SearchPostsFilters;
	/** the free text left after lifting: quotes, OR groups, bare/`-word` negations, unknown operators. */
	text: string;
}

// a leading `-` negates the operator (`-from:` → excludeAuthors); `#tag` / `-#tag` are hashtags.
const LIFT_OPERATOR_RE = /^(-)?([a-z]+):(.*)$/;
const LIFT_HASHTAG_RE = /^(-)?#([^:]+)$/;
// only full ISO dates lift; partials stay in the text for the backend to parse.
const LIFT_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

// suggestions show `@user`, but the API expects the handle without `@`.
const stripHandleMarker = (value: string): string => (value.startsWith('@') ? value.slice(1) : value);

/**
 * moves recognized operators into `searchPostsV2` filters and leaves other text in `text`.
 *
 * @param query the raw query text
 * @param options.viewerDid the signed-in account's did
 * @returns the residual free text and lifted filters
 */
export const liftSearchQuery = (query: string, options?: { viewerDid?: Did }): LiftedQuery => {
	const viewerDid = options?.viewerDid;

	const kept: string[] = [];
	const authors: ActorIdentifier[] = [];
	const excludeAuthors: ActorIdentifier[] = [];
	const mentions: ActorIdentifier[] = [];
	const excludeMentions: ActorIdentifier[] = [];
	const domains: string[] = [];
	const excludeDomains: string[] = [];
	const urls: GenericUri[] = [];
	const excludeUrls: GenericUri[] = [];
	const hashtags: string[] = [];
	const excludeHashtags: string[] = [];
	const languages: string[] = [];
	const excludeLanguages: string[] = [];

	const filters: SearchPostsFilters = {};

	for (const token of tokenize(query)) {
		if (token.type === 'whitespace') {
			continue;
		}
		if (token.type === 'quoted') {
			kept.push(token.value);
			continue;
		}

		const value = token.value;

		const hashtag = LIFT_HASHTAG_RE.exec(value);
		if (hashtag) {
			(hashtag[1] ? excludeHashtags : hashtags).push(hashtag[2]!);
			continue;
		}

		const operator = LIFT_OPERATOR_RE.exec(value);
		// leave valueless operators in the text while they are being typed.
		if (!operator || operator[3] === '') {
			kept.push(value);
			continue;
		}

		const negated = operator[1] !== undefined;
		const name = operator[2]!;
		const arg = operator[3]!;

		let handled = true;
		switch (name) {
			case 'from': {
				if (!negated && arg === 'following') {
					filters.following = true;
				} else {
					const actor = arg === 'me' ? viewerDid : stripHandleMarker(arg);
					if (actor && isActorIdentifier(actor)) {
						(negated ? excludeAuthors : authors).push(actor);
					} else {
						handled = false;
					}
				}
				break;
			}
			case 'mentions': {
				const actor = arg === 'me' ? viewerDid : stripHandleMarker(arg);
				if (actor && isActorIdentifier(actor)) {
					(negated ? excludeMentions : mentions).push(actor);
				} else {
					handled = false;
				}
				break;
			}
			case 'domain': {
				(negated ? excludeDomains : domains).push(arg);
				break;
			}
			case 'url': {
				// a bare host isn't a uri; `domain:` is the operator for that, so leave it in the text
				if (isGenericUri(arg)) {
					(negated ? excludeUrls : urls).push(arg);
				} else {
					handled = false;
				}
				break;
			}
			case 'lang': {
				(negated ? excludeLanguages : languages).push(arg);
				break;
			}
			case 'since': {
				if (!negated && LIFT_DATE_RE.test(arg)) {
					filters.since = arg;
				} else {
					handled = false;
				}
				break;
			}
			case 'until': {
				if (!negated && LIFT_DATE_RE.test(arg)) {
					filters.until = arg;
				} else {
					handled = false;
				}
				break;
			}
			case 'has': {
				if (negated) {
					handled = false;
				} else if (arg === 'media') {
					filters.hasMedia = true;
				} else if (arg === 'video') {
					filters.hasVideo = true;
				} else {
					handled = false;
				}
				break;
			}
			case 'replies': {
				if (negated) {
					handled = false;
				} else if (arg === 'none') {
					filters.excludeReplies = true;
				} else if (arg === 'only') {
					filters.repliesOnly = true;
				} else {
					handled = false;
				}
				break;
			}
			default: {
				handled = false;
			}
		}

		if (!handled) {
			kept.push(value);
		}
	}

	// the server rejects both reply filters together.
	if (filters.excludeReplies && filters.repliesOnly) {
		delete filters.excludeReplies;
		delete filters.repliesOnly;
	}

	if (authors.length) {
		filters.authors = authors;
	}
	if (excludeAuthors.length) {
		filters.excludeAuthors = excludeAuthors;
	}
	if (mentions.length) {
		filters.mentions = mentions;
	}
	if (excludeMentions.length) {
		filters.excludeMentions = excludeMentions;
	}
	if (domains.length) {
		filters.domains = domains;
	}
	if (excludeDomains.length) {
		filters.excludeDomains = excludeDomains;
	}
	if (urls.length) {
		filters.urls = urls;
	}
	if (excludeUrls.length) {
		filters.excludeUrls = excludeUrls;
	}
	if (hashtags.length) {
		filters.hashtags = hashtags;
	}
	if (excludeHashtags.length) {
		filters.excludeHashtags = excludeHashtags;
	}
	if (languages.length) {
		filters.languages = languages;
	}
	if (excludeLanguages.length) {
		filters.excludeLanguages = excludeLanguages;
	}

	return { filters, text: kept.join(' ') };
};

export function normalizeSearchQuery(query: string) {
	// some keyboards add fancy unicode quotes, but only normal ones work
	return query.replaceAll(/[“”]/g, '"');
}
