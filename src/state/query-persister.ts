import {
	notifyManager,
	type Query,
	type QueryFunction,
	type QueryFunctionContext,
	type QueryKey,
} from '@tanstack/react-query';

import { getCurrentDid } from '#/state/session/store';

import { persistedQueryCache } from '#/storage';
import type { PersistedQueryEntry, QueryCacheScope } from '#/storage/schema';

/**
 * creates a query persister.
 *
 * @param options.version format version
 * @returns the persister
 */
export const createQueryPersister = ({ version }: { version: number }) => {
	return async <T, TQueryKey extends QueryKey>(
		queryFn: QueryFunction<T, TQueryKey>,
		context: QueryFunctionContext<TQueryKey>,
		query: Query,
	): Promise<T> => {
		const scope: QueryCacheScope = getCurrentDid() ?? 'logged-out';

		if (query.state.data === undefined) {
			const stored = persistedQueryCache.get([scope, query.queryHash]);
			if (stored?.version === version && stored.expiresAt > Date.now()) {
				notifyManager.schedule(() => {
					// preserve the cached fetch time for stale checks.
					query.setState({ dataUpdatedAt: stored.dataUpdatedAt });
					if (query.isStale()) {
						void query.fetch();
					}
				});

				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- hash and version identify the query type
				return stored.data as T;
			}

			if (stored !== undefined) {
				persistedQueryCache.remove([scope, query.queryHash]);
			}
		}

		const data = await queryFn(context);
		notifyManager.schedule(() => {
			if (query.state.status !== 'success') {
				return;
			}

			persistedQueryCache.set([scope, query.queryHash], {
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- query data must be JSON-serializable
				data: query.state.data as PersistedQueryEntry['data'],
				dataUpdatedAt: query.state.dataUpdatedAt,
				expiresAt: query.state.dataUpdatedAt + query.gcTime,
				version,
			});
		});

		return data;
	};
};
