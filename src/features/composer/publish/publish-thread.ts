import type { ComAtprotoRepoApplyWrites, ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyFeedPost } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import * as TID from '@atcute/tid';

import { getPostRecord } from '#/lib/api/record-casts';
import { computeRecordCid } from '#/lib/api/record-cid';
import { createCachedHandleResolver } from '#/lib/api/richtext';
import {
	type InteractionSettings,
	quotesToEmbeddingRules,
	repliesToThreadgateAllow,
} from '#/lib/interaction-settings';

import { createThreadgateRecord } from '#/state/queries/threadgate/util';

import { m } from '#/paraglide/messages';

import { fetchPost, type ResolveContext, resolvePost } from './resolve-post';
import type { PlannedPost } from './snapshot';

type Write = ComAtprotoRepoApplyWrites.$input['writes'][number];

type ReplyRef = AppBskyFeedPost.ReplyRef;

const resolveReplyRef = async (appview: Client, uri: ResourceUri): Promise<ReplyRef> => {
	const parent = await fetchPost(appview, uri, m['features.composer.publish.error.replyMissing']());
	const parentRef: ComAtprotoRepoStrongRef.Main = { uri: parent.uri, cid: parent.cid };
	return { root: getPostRecord(parent).reply?.root ?? parentRef, parent: parentRef };
};

/**
 * publishes a thread atomically.
 *
 * @param clients API clients, query cache, video uploads, and destination repo DID
 * @param options.posts the posts to publish, at least one
 * @param options.replyUri reply parent's AT-URI, or null for a top-level thread
 * @param options.interaction the thread's interaction settings
 * @param options.signal cancels the publish until the posts are sent
 * @returns the AT-URIs of the published posts, in order
 * @throws {PublishError} if the reply parent is unavailable or {@link resolvePost} rejects a post
 * @throws the signal's abort reason if `signal` aborts before the posts are sent
 */
export const publishThread = async (
	{ did, ...clients }: Omit<ResolveContext, 'resolveHandle'> & { did: Did },
	{
		posts,
		replyUri,
		interaction,
		signal,
	}: {
		posts: readonly PlannedPost[];
		replyUri: ResourceUri | null;
		interaction: InteractionSettings;
		signal: AbortSignal;
	},
): Promise<ResourceUri[]> => {
	const ctx: ResolveContext = { ...clients, resolveHandle: createCachedHandleResolver(clients.appview) };

	const [replyRef, resolved] = await Promise.all([
		replyUri !== null ? resolveReplyRef(ctx.appview, replyUri) : undefined,
		Promise.all(posts.map((post) => resolvePost(ctx, post))),
	]);

	const threadgateAllow = repliesToThreadgateAllow(interaction.replies);
	const embeddingRules = quotesToEmbeddingRules(interaction.allowQuotes);

	const writes: Write[] = [];
	const uris: ResourceUri[] = [];

	let reply = replyRef;
	const now = Date.now();
	for (const [i, { rt, embed, labels, langs }] of resolved.entries()) {
		const rkey = TID.now();
		const uri: ResourceUri = `at://${did}/app.bsky.feed.post/${rkey}`;
		// give posts a stable order when sorted by time.
		const createdAt = new Date(now + i).toISOString();

		const record: AppBskyFeedPost.Main = {
			$type: 'app.bsky.feed.post',
			createdAt,
			text: rt.text,
			facets: rt.facets,
			reply,
			embed,
			langs,
			labels,
		};

		uris.push(uri);
		writes.push({
			$type: 'com.atproto.repo.applyWrites#create',
			collection: 'app.bsky.feed.post',
			rkey,
			value: record,
		});

		if (i === 0 && threadgateAllow) {
			writes.push({
				$type: 'com.atproto.repo.applyWrites#create',
				collection: 'app.bsky.feed.threadgate',
				rkey,
				value: createThreadgateRecord({ allow: threadgateAllow, post: uri }),
			});
		}
		if (embeddingRules) {
			writes.push({
				$type: 'com.atproto.repo.applyWrites#create',
				collection: 'app.bsky.feed.postgate',
				rkey,
				value: { $type: 'app.bsky.feed.postgate', createdAt, embeddingRules, post: uri },
			});
		}

		if (i < resolved.length - 1) {
			const ref: ComAtprotoRepoStrongRef.Main = { uri, cid: await computeRecordCid(record) };
			reply = { root: reply?.root ?? ref, parent: ref };
		}
	}

	// once sent, applyWrites cannot be cancelled.
	signal.throwIfAborted();
	await ok(ctx.pds.post('com.atproto.repo.applyWrites', { input: { repo: did, validate: true, writes } }));

	return uris;
};
