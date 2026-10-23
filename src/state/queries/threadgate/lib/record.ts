import type { AppBskyFeedThreadgate } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { isDid, parseResourceUri } from '@atcute/lexicons/syntax';

import { getRecord, putRecord } from '#/lib/api/records';
import { isRecordNotFoundError } from '#/lib/errors';
import { createThreadgateRecord, validateThreadgateRecordOrThrow } from '#/lib/threadgate';
import { networkRetry, retry } from '#/lib/utils/retry';

export async function getThreadgateRecord({
	appview,
	pds,
	postUri,
	signal,
}: {
	appview: Client;
	pds: Client;
	postUri: ResourceUri;
	signal?: AbortSignal;
}): Promise<AppBskyFeedThreadgate.Main | null> {
	const urip = parseResourceUri(postUri);

	const repo = isDid(urip.repo)
		? urip.repo
		: (
				await ok(
					appview.get('com.atproto.identity.resolveHandle', {
						signal,
						params: { handle: urip.repo },
					}),
				)
			).did;

	try {
		const data = await retry(
			2,
			(e) => {
				signal?.throwIfAborted();
				/*
				 * If the record doesn't exist, we want to return null instead of
				 * throwing an error. NB: This will also catch reference errors, such as
				 * a typo in the URI.
				 */
				if (isRecordNotFoundError(e)) {
					return false;
				}
				return true;
			},
			() =>
				getRecord(pds, {
					signal,
					repo,
					collection: 'app.bsky.feed.threadgate',
					rkey: urip.rkey!,
				}),
		);

		return data.value ?? null;
	} catch (e) {
		/*
		 * If the record doesn't exist, we want to return null instead of
		 * throwing an error. NB: This will also catch reference errors, such as
		 * a typo in the URI.
		 */
		if (isRecordNotFoundError(e)) {
			return null;
		} else {
			throw e;
		}
	}
}

export async function writeThreadgateRecord({
	did,
	pds,
	postUri,
	threadgate,
}: {
	did: Did;
	pds: Client;
	postUri: ResourceUri;
	threadgate: AppBskyFeedThreadgate.Main;
}) {
	const postUrip = parseResourceUri(postUri);
	const record = createThreadgateRecord({
		allow: threadgate.allow, // can/should be undefined!
		hiddenReplies: threadgate.hiddenReplies || [],
		post: postUri,
	});

	await networkRetry(2, () =>
		putRecord(pds, {
			repo: did,
			rkey: postUrip.rkey!,
			record,
		}),
	);
}

export async function upsertThreadgate(
	{
		appview,
		did,
		pds,
		postUri,
	}: {
		appview: Client;
		did: Did;
		pds: Client;
		postUri: ResourceUri;
	},
	callback: (
		threadgate: AppBskyFeedThreadgate.Main | null,
	) => AppBskyFeedThreadgate.Main | Promise<AppBskyFeedThreadgate.Main | undefined> | undefined,
) {
	const prev = await getThreadgateRecord({
		appview,
		pds,
		postUri,
	});
	const next = await callback(prev);
	if (!next) {
		return;
	}
	validateThreadgateRecordOrThrow(next);
	await writeThreadgateRecord({
		did,
		pds,
		postUri,
		threadgate: next,
	});
}
