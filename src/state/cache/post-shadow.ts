import { useEffect, useMemo, useState } from 'react';

import type { AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import type { QueryClient } from '@tanstack/react-query';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { KeyedEventEmitter } from '#/lib/keyed-event-emitter';

import { getPostFinders } from './registry';
import { castAsShadow, type Shadow } from './types';
export type { Shadow } from './types';

export interface PostShadow {
	/** the record uri, or `'pending'` while the write is in flight */
	likeUri: 'pending' | ResourceUri | undefined;
	/** the record uri, or `'pending'` while the write is in flight */
	repostUri: 'pending' | ResourceUri | undefined;
	isDeleted: boolean;
	embed: AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined;
	pinned: boolean;
	optimisticReplyCount: number | undefined;
	bookmarked: boolean | undefined;
}

export const POST_TOMBSTONE = Symbol('PostTombstone');

const emitter = new KeyedEventEmitter<[]>();
const shadows: WeakMap<AppBskyFeedDefs.PostView, Partial<PostShadow>> = new WeakMap();

/** Use with caution! This function returns the raw shadow data for a post. Prefer using `usePostShadow`. */
export function dangerousGetPostShadow(post: AppBskyFeedDefs.PostView) {
	return shadows.get(post);
}

export function usePostShadow(
	post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
	const [shadow, setShadow] = useState(() => shadows.get(post));
	const [prevPost, setPrevPost] = useState(post);
	if (post !== prevPost) {
		setPrevPost(post);
		setShadow(shadows.get(post));
	}

	useEffect(() => {
		function onUpdate() {
			setShadow(shadows.get(post));
		}
		return emitter.subscribe(post.uri, onUpdate);
	}, [post, setShadow]);

	return useMemo(() => {
		if (shadow) {
			return mergeShadow(post, shadow);
		} else {
			return castAsShadow(post);
		}
	}, [post, shadow]);
}

function mergeShadow(
	post: AppBskyFeedDefs.PostView,
	shadow: Partial<PostShadow>,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
	if (shadow.isDeleted) {
		return POST_TOMBSTONE;
	}

	let likeCount = post.likeCount ?? 0;
	if ('likeUri' in shadow) {
		const wasLiked = !!post.viewer?.like;
		const isLiked = !!shadow.likeUri;
		if (wasLiked && !isLiked) {
			likeCount--;
		} else if (!wasLiked && isLiked) {
			likeCount++;
		}
		likeCount = Math.max(0, likeCount);
	}

	let bookmarkCount = post.bookmarkCount ?? 0;
	if ('bookmarked' in shadow) {
		const wasBookmarked = !!post.viewer?.bookmarked;
		const isBookmarked = !!shadow.bookmarked;
		if (wasBookmarked && !isBookmarked) {
			bookmarkCount--;
		} else if (!wasBookmarked && isBookmarked) {
			bookmarkCount++;
		}
		bookmarkCount = Math.max(0, bookmarkCount);
	}

	let repostCount = post.repostCount ?? 0;
	if ('repostUri' in shadow) {
		const wasReposted = !!post.viewer?.repost;
		const isReposted = !!shadow.repostUri;
		if (wasReposted && !isReposted) {
			repostCount--;
		} else if (!wasReposted && isReposted) {
			repostCount++;
		}
		repostCount = Math.max(0, repostCount);
	}

	let replyCount = post.replyCount ?? 0;
	if ('optimisticReplyCount' in shadow) {
		replyCount = shadow.optimisticReplyCount ?? replyCount;
	}

	let embed: typeof post.embed;
	if ('embed' in shadow) {
		if (
			(post.embed?.$type === 'app.bsky.embed.record#view' &&
				shadow.embed?.$type === 'app.bsky.embed.record#view') ||
			(post.embed?.$type === 'app.bsky.embed.recordWithMedia#view' &&
				shadow.embed?.$type === 'app.bsky.embed.recordWithMedia#view')
		) {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the `$type` checks above pin both embeds to the same view
			embed = shadow.embed as typeof post.embed;
		}
	}

	return castAsShadow<AppBskyFeedDefs.PostView>({
		...post,
		embed: embed || post.embed,
		likeCount: likeCount,
		repostCount: repostCount,
		replyCount: replyCount,
		bookmarkCount: bookmarkCount,
		viewer: {
			...post.viewer,
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `likeUri` carries the `'pending'` sentinel mid-write; readers only test truthiness
			like: 'likeUri' in shadow ? (shadow.likeUri as ResourceUri | undefined) : post.viewer?.like,
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `repostUri` carries the `'pending'` sentinel mid-write; readers only test truthiness
			repost: 'repostUri' in shadow ? (shadow.repostUri as ResourceUri | undefined) : post.viewer?.repost,
			pinned: 'pinned' in shadow ? shadow.pinned : post.viewer?.pinned,
			bookmarked: 'bookmarked' in shadow ? shadow.bookmarked : post.viewer?.bookmarked,
		},
	});
}

export function updatePostShadow(queryClient: QueryClient, uri: string, value: Partial<PostShadow>) {
	const cachedPosts = findPostsInCache(queryClient, uri);
	for (const post of cachedPosts) {
		shadows.set(post, { ...shadows.get(post), ...value });
	}
	batchedUpdates(() => {
		emitter.emit(uri);
	});
}

function* findPostsInCache(queryClient: QueryClient, uri: string): Generator<AppBskyFeedDefs.PostView, void> {
	for (const findPosts of getPostFinders()) {
		yield* findPosts(queryClient, uri);
	}
}
