import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';

import { mapDefined, unique, uniqueBy } from '@mary/array-fns';

import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';

export function threadgateViewToAllowUISetting(
	threadgateView: AppBskyFeedDefs.ThreadgateView | undefined,
): ThreadgateAllowUISetting[] {
	const record = threadgateView?.record;
	const threadgate =
		record && (record as { $type?: string }).$type === 'app.bsky.feed.threadgate'
			? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- view defs type `record` as `unknown`; the `$type` check above pins it to the threadgate record
				(record as AppBskyFeedThreadgate.Main)
			: undefined;
	return threadgateRecordToAllowUISetting(threadgate);
}

/**
 * Converts the `allow` rules of an {@link AppBskyFeedThreadgate.Main} to a list of
 * {@link ThreadgateAllowUISetting}, for use by app UI.
 */
export function threadgateRecordToAllowUISetting(
	threadgate: Pick<AppBskyFeedThreadgate.Main, 'allow'> | undefined,
): ThreadgateAllowUISetting[] {
	/*
	 * If `threadgate` doesn't exist (default), or if `threadgate.allow === undefined`, it means
	 * anyone can reply.
	 *
	 * If `threadgate.allow === []` it means no one can reply, and we translate to UI code
	 * here. This was a historical choice, and we have no lexicon representation
	 * for 'replies disabled' other than an empty array.
	 */
	if (!threadgate || threadgate.allow === undefined) {
		return [{ type: 'everybody' }];
	}
	if (threadgate.allow.length === 0) {
		return [{ type: 'nobody' }];
	}

	return mapDefined(threadgate.allow, (allow): ThreadgateAllowUISetting | undefined => {
		switch (allow.$type) {
			case 'app.bsky.feed.threadgate#followerRule': {
				return { type: 'followers' };
			}
			case 'app.bsky.feed.threadgate#followingRule': {
				return { type: 'following' };
			}
			case 'app.bsky.feed.threadgate#listRule': {
				return { type: 'list', list: allow.list };
			}
			case 'app.bsky.feed.threadgate#mentionRule': {
				return { type: 'mention' };
			}
		}
	});
}

export type ThreadgateReplyMode = 'anyone' | 'nobody' | 'some';

/**
 * returns the reply mode using the same precedence as {@link threadgateAllowUISettingToAllowRecordValue}.
 *
 * @param settings allow UI settings
 * @returns `anyone` when everybody can reply, `nobody` when replies are disabled (including an empty list),
 *   otherwise `some`
 */
export function getThreadgateReplyMode(settings: ThreadgateAllowUISetting[]): ThreadgateReplyMode {
	if (settings.some((v) => v.type === 'everybody')) {
		return 'anyone';
	}
	if (settings.length === 0 || settings.some((v) => v.type === 'nobody')) {
		return 'nobody';
	}
	return 'some';
}

/**
 * allows everyone when no reply groups remain selected. this prevents deselecting the last group from
 * disabling replies.
 *
 * @param settings allow UI settings built from the user's selected groups
 * @returns `settings`, or `[{ type: 'everybody' }]` when it's empty
 */
export function coalesceAllowUISettings(settings: ThreadgateAllowUISetting[]): ThreadgateAllowUISetting[] {
	return settings.length > 0 ? settings : [{ type: 'everybody' }];
}

/** converts threadgate allow UI settings to the AppBskyFeedThreadgate.Main allow prop */
export function threadgateAllowUISettingToAllowRecordValue(
	threadgate: ThreadgateAllowUISetting[],
): AppBskyFeedThreadgate.Main['allow'] {
	if (threadgate.find((v) => v.type === 'everybody')) {
		return undefined;
	}

	const allow: Exclude<AppBskyFeedThreadgate.Main['allow'], undefined> = [];

	if (!threadgate.find((v) => v.type === 'nobody')) {
		for (const rule of threadgate) {
			if (rule.type === 'mention') {
				allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
			} else if (rule.type === 'following') {
				allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
			} else if (rule.type === 'followers') {
				allow.push({ $type: 'app.bsky.feed.threadgate#followerRule' });
			} else if (rule.type === 'list') {
				allow.push({
					$type: 'app.bsky.feed.threadgate#listRule',
					list: rule.list,
				});
			}
		}
	}

	return allow;
}

/**
 * merges two {@link AppBskyFeedThreadgate.Main} objects, combining and deduplicating their `allow` and
 * `hiddenReplies` arrays.
 *
 * @param a first threadgate object
 * @param b second threadgate object
 * @returns the merged threadgate object
 */
export function mergeThreadgateRecords(
	prev: AppBskyFeedThreadgate.Main,
	next: Partial<AppBskyFeedThreadgate.Main>,
): AppBskyFeedThreadgate.Main {
	// can be undefined if everyone can reply!
	const allow: AppBskyFeedThreadgate.Main['allow'] | undefined =
		prev.allow || next.allow
			? uniqueBy([...(prev.allow || []), ...(next.allow || [])], (v) => v.$type)
			: undefined;
	const hiddenReplies = unique([...(prev.hiddenReplies || []), ...(next.hiddenReplies || [])]);

	return createThreadgateRecord({
		allow, // can be undefined!
		hiddenReplies,
		post: prev.post,
	});
}

/** Create a new {@link AppBskyFeedThreadgate.Main} object with the given properties. */
export function createThreadgateRecord(
	threadgate: Partial<AppBskyFeedThreadgate.Main>,
): AppBskyFeedThreadgate.Main {
	if (!threadgate.post) {
		throw new Error('Cannot create a threadgate record without a post URI');
	}

	return {
		$type: 'app.bsky.feed.threadgate',
		allow: threadgate.allow, // can be undefined!
		createdAt: new Date().toISOString(),
		hiddenReplies: threadgate.hiddenReplies || [],
		post: threadgate.post,
	};
}
