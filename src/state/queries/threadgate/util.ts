import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';

export function threadgateViewToAllowUISetting(
	threadgateView: AppBskyFeedDefs.ThreadgateView | undefined,
): ThreadgateAllowUISetting[] {
	const record = threadgateView?.record;
	const threadgate =
		record && (record as { $type?: string }).$type === 'app.bsky.feed.threadgate'
			? (record as AppBskyFeedThreadgate.Main)
			: undefined;
	return threadgateRecordToAllowUISetting(threadgate);
}

/**
 * Converts a full {@link AppBskyFeedThreadgate.Main} to a list of {@link ThreadgateAllowUISetting}, for use by
 * app UI.
 */
export function threadgateRecordToAllowUISetting(
	threadgate: AppBskyFeedThreadgate.Main | undefined,
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

	const settings: ThreadgateAllowUISetting[] = threadgate.allow
		.map((allow): ThreadgateAllowUISetting | undefined => {
			switch (allow.$type) {
				case 'app.bsky.feed.threadgate#followerRule':
					return { type: 'followers' };
				case 'app.bsky.feed.threadgate#followingRule':
					return { type: 'following' };
				case 'app.bsky.feed.threadgate#listRule':
					return { list: allow.list, type: 'list' };
				case 'app.bsky.feed.threadgate#mentionRule':
					return { type: 'mention' };
			}
		})
		.filter((n) => !!n);
	return settings;
}

/** converts threadgate allow UI settings to the AppBskyFeedThreadgate.Main allow prop */
export function threadgateAllowUISettingToAllowRecordValue(
	threadgate: ThreadgateAllowUISetting[],
): AppBskyFeedThreadgate.Main['allow'] {
	if (threadgate.find((v) => v.type === 'everybody')) {
		return undefined;
	}

	let allow: Exclude<AppBskyFeedThreadgate.Main['allow'], undefined> = [];

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
					list: rule.list as ResourceUri,
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
			? [...(prev.allow || []), ...(next.allow || [])].filter(
					(v, i, a) => a.findIndex((t) => t.$type === v.$type) === i,
				)
			: undefined;
	const hiddenReplies = Array.from(new Set([...(prev.hiddenReplies || []), ...(next.hiddenReplies || [])]));

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
