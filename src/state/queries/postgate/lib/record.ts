import type { AppBskyFeedPostgate } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { isDid, parseResourceUri } from '@atcute/lexicons/syntax';

import { getRecord, putRecord } from '#/lib/api/records';
import { isRecordNotFoundError } from '#/lib/errors';
import { POSTGATE_COLLECTION } from '#/lib/postgate';
import { networkRetry, retry } from '#/lib/utils/retry';

export async function getPostgateRecord({
	appview,
	pds,
	postUri,
	signal,
}: {
	appview: Client;
	pds: Client;
	postUri: ResourceUri;
	signal?: AbortSignal;
}): Promise<AppBskyFeedPostgate.Main | undefined> {
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
					collection: POSTGATE_COLLECTION,
					rkey: urip.rkey!,
				}),
		);

		return data.value ?? undefined;
	} catch (e) {
		/*
		 * If the record doesn't exist, we want to return null instead of
		 * throwing an error. NB: This will also catch reference errors, such as
		 * a typo in the URI.
		 */
		if (isRecordNotFoundError(e)) {
			return undefined;
		} else {
			throw e;
		}
	}
}

export async function writePostgateRecord({
	did,
	pds,
	postUri,
	postgate,
}: {
	did: Did;
	pds: Client;
	postUri: ResourceUri;
	postgate: AppBskyFeedPostgate.Main;
}) {
	const postUrip = parseResourceUri(postUri);

	await networkRetry(2, () =>
		putRecord(pds, {
			repo: did,
			rkey: postUrip.rkey!,
			record: postgate,
		}),
	);
}

export async function upsertPostgate(
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
		postgate: AppBskyFeedPostgate.Main | undefined,
	) => AppBskyFeedPostgate.Main | Promise<AppBskyFeedPostgate.Main | undefined> | undefined,
) {
	const prev = await getPostgateRecord({
		appview,
		pds,
		postUri,
	});
	const next = await callback(prev);
	if (!next) {
		return;
	}
	await writePostgateRecord({
		did,
		pds,
		postUri,
		postgate: next,
	});
}
