import type { ComAtprotoRepoApplyWrites } from '@atcute/atproto';
import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';

// supports larger starter packs than this client's creation limit.
const ALL_MEMBERS_LIMIT = 500;
const ALL_MEMBERS_PAGE_SIZE = 100;
// bounds requests even if the server keeps returning a cursor.
const ALL_MEMBERS_MAX_REQUESTS = 10;

/**
 * fetches list members across pages.
 *
 * @param client the appview client
 * @param uri the list to read
 * @param signal aborts the fetch
 * @returns up to {@link ALL_MEMBERS_LIMIT} members, stopping after {@link ALL_MEMBERS_MAX_REQUESTS} requests
 */
export async function getAllListMembers(client: Client, uri: ResourceUri, signal?: AbortSignal) {
	let cursor: string | undefined;
	const listItems: AppBskyGraphDefs.ListItemView[] = [];

	for (let i = 0; i < ALL_MEMBERS_MAX_REQUESTS && listItems.length < ALL_MEMBERS_LIMIT; i++) {
		const remaining = ALL_MEMBERS_LIMIT - listItems.length;
		const data = await ok(
			client.get('app.bsky.graph.getList', {
				signal,
				params: { cursor, limit: Math.min(ALL_MEMBERS_PAGE_SIZE, remaining), list: uri },
			}),
		);
		listItems.push(...data.items.slice(0, remaining));
		cursor = data.cursor;
		if (!cursor) {
			break;
		}
	}

	return listItems;
}

/**
 * prepares a list membership for batch creation.
 *
 * @param options.did the account to add
 * @param options.listUri the list to add it to
 * @returns an `applyWrites` create operation with the current timestamp
 */
export const createListItemWrite = ({
	did,
	listUri,
}: {
	did: Did;
	listUri: ResourceUri;
}): ComAtprotoRepoApplyWrites.$input['writes'][number] => {
	return {
		$type: 'com.atproto.repo.applyWrites#create',
		collection: 'app.bsky.graph.listitem',
		value: {
			$type: 'app.bsky.graph.listitem',
			createdAt: new Date().toISOString(),
			list: listUri,
			subject: did,
		},
	};
};
