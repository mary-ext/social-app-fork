import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedPostgate,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { unique } from '@mary-ext/array-fns';

export type ReplyGroups = {
	followers: boolean;
	following: boolean;
	lists: readonly ResourceUri[];
	mentioned: boolean;
};

export type ReplyAudience = { type: 'anyone' } | { type: 'nobody' } | ({ type: 'some' } & ReplyGroups);

export type InteractionSettings = {
	allowQuotes: boolean;
	replies: ReplyAudience;
};

// #region replies

export const NO_REPLY_GROUPS: ReplyGroups = {
	followers: false,
	following: false,
	lists: [],
	mentioned: false,
};

/**
 * builds a reply audience from selected groups.
 *
 * @param groups the groups allowed to reply
 * @returns `some` with deduplicated lists, or `anyone` if no group is selected
 */
export const restrictReplies = (groups: ReplyGroups): ReplyAudience => {
	const lists = unique(groups.lists);
	if (!groups.followers && !groups.following && !groups.mentioned && lists.length === 0) {
		return { type: 'anyone' };
	}

	return {
		type: 'some',
		followers: groups.followers,
		following: groups.following,
		lists,
		mentioned: groups.mentioned,
	};
};

/**
 * converts threadgate rules to a reply audience, ignoring unknown rules.
 *
 * @param allow threadgate rules; `undefined` allows anyone to reply
 * @returns the recognized groups, or `nobody` if the array is empty or has only unknown rules
 */
export const repliesFromThreadgateAllow = (allow: AppBskyFeedThreadgate.Main['allow']): ReplyAudience => {
	if (allow === undefined) {
		return { type: 'anyone' };
	}

	const lists: ResourceUri[] = [];
	const groups = { ...NO_REPLY_GROUPS, lists };
	let known = false;

	for (const rule of allow) {
		switch (rule.$type) {
			case 'app.bsky.feed.threadgate#followerRule': {
				groups.followers = true;
				known = true;
				break;
			}
			case 'app.bsky.feed.threadgate#followingRule': {
				groups.following = true;
				known = true;
				break;
			}
			case 'app.bsky.feed.threadgate#listRule': {
				lists.push(rule.list);
				known = true;
				break;
			}
			case 'app.bsky.feed.threadgate#mentionRule': {
				groups.mentioned = true;
				known = true;
				break;
			}
		}
	}

	// unknown rules must not turn a restricted thread into an unrestricted one.
	return known ? restrictReplies(groups) : { type: 'nobody' };
};

/**
 * reads reply permissions from a threadgate view.
 *
 * @param view the threadgate view, if the post has one
 * @returns the reply audience, or `anyone` if no threadgate record is present
 */
export const repliesFromThreadgateView = (
	view: AppBskyFeedDefs.ThreadgateView | undefined,
): ReplyAudience => {
	const record = view?.record;
	if (!record || (record as { $type?: string }).$type !== 'app.bsky.feed.threadgate') {
		return { type: 'anyone' };
	}

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- view records are untyped; `$type` is checked above
	return repliesFromThreadgateAllow((record as AppBskyFeedThreadgate.Main).allow);
};

/**
 * converts a reply audience to threadgate `allow` rules.
 *
 * @param replies the reply audience
 * @returns `undefined` for `anyone`, an empty array for `nobody`, or the selected groups' rules
 */
export const repliesToThreadgateAllow = (replies: ReplyAudience): AppBskyFeedThreadgate.Main['allow'] => {
	switch (replies.type) {
		case 'anyone': {
			return undefined;
		}
		case 'nobody': {
			return [];
		}
		case 'some': {
			const allow: NonNullable<AppBskyFeedThreadgate.Main['allow']> = [];
			if (replies.mentioned) {
				allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
			}
			if (replies.following) {
				allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
			}
			if (replies.followers) {
				allow.push({ $type: 'app.bsky.feed.threadgate#followerRule' });
			}
			for (const list of replies.lists) {
				allow.push({ $type: 'app.bsky.feed.threadgate#listRule', list });
			}
			return allow;
		}
	}
};

/**
 * compares reply audiences with duplicate-free lists, ignoring list order.
 *
 * @param a first audience
 * @param b second audience
 * @returns whether the audience types and groups match
 */
export const isReplyAudienceEqual = (a: ReplyAudience, b: ReplyAudience): boolean => {
	if (a.type !== 'some' || b.type !== 'some') {
		return a.type === b.type;
	}

	return (
		a.followers === b.followers &&
		a.following === b.following &&
		a.mentioned === b.mentioned &&
		a.lists.length === b.lists.length &&
		a.lists.every((list) => b.lists.includes(list))
	);
};

// #endregion

// #region quotes

/**
 * reads quote permissions from postgate rules.
 *
 * @param rules postgate rules, if any
 * @returns `false` if a disable rule is present; `true` otherwise
 */
export const quotesFromEmbeddingRules = (rules: AppBskyFeedPostgate.Main['embeddingRules']): boolean => {
	return !rules?.some((rule) => rule.$type === 'app.bsky.feed.postgate#disableRule');
};

/**
 * converts the quote setting to postgate `embeddingRules`.
 *
 * @param allowQuotes whether quoting is allowed
 * @returns `undefined` if quoting is allowed, or a disable rule
 */
export const quotesToEmbeddingRules = (allowQuotes: boolean): AppBskyFeedPostgate.Main['embeddingRules'] => {
	return allowQuotes ? undefined : [{ $type: 'app.bsky.feed.postgate#disableRule' }];
};

// #endregion

/**
 * reads the account's default interaction settings.
 *
 * @param pref the stored preference, if loaded
 * @returns the account defaults, or unrestricted replies and quotes if the preference is absent
 */
export const interactionSettingsFromPreferences = (
	pref:
		| Pick<AppBskyActorDefs.PostInteractionSettingsPref, 'postgateEmbeddingRules' | 'threadgateAllowRules'>
		| undefined,
): InteractionSettings => {
	return {
		allowQuotes: quotesFromEmbeddingRules(pref?.postgateEmbeddingRules),
		replies: repliesFromThreadgateAllow(pref?.threadgateAllowRules),
	};
};

/**
 * converts interaction settings to the stored preference.
 *
 * @param settings reply and quote settings
 * @returns the preference value
 */
export const interactionSettingsToPreferences = (
	settings: InteractionSettings,
): AppBskyActorDefs.PostInteractionSettingsPref => {
	return {
		postgateEmbeddingRules: quotesToEmbeddingRules(settings.allowQuotes),
		threadgateAllowRules: repliesToThreadgateAllow(settings.replies),
	};
};

/**
 * compares settings with duplicate-free reply lists, ignoring list order.
 *
 * @param a first settings
 * @param b second settings
 * @returns whether reply and quote settings match
 */
export const isInteractionSettingsEqual = (a: InteractionSettings, b: InteractionSettings): boolean => {
	return a.allowQuotes === b.allowQuotes && isReplyAudienceEqual(a.replies, b.replies);
};
