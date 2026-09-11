import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ClientResponseError, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';

import { chunked, groupByDefined } from '@mary/array-fns';

import type { ListRecordsOutput } from '#/lib/api/records';
import { isAbortError } from '#/lib/errors';
import { labelIsHideableOffense } from '#/lib/moderation/causes';
import type { RateLimitBudget } from '#/lib/rate-limit-budget';
import { accumulate } from '#/lib/utils/accumulate';
import { networkRetry } from '#/lib/utils/retry';
import { limitConcurrency } from '#/lib/utils/task';

// #region types

/** issue sort order, most severe first. */
export const followIssuesBySeverity = [
	'unavailable',
	'deactivated',
	'suspended',
	'hidden',
	'blockedBy',
	'blocking',
	'self',
] as const;

/** why a follow was flagged. */
export type FollowIssue = (typeof followIssuesBySeverity)[number];

/** a flagged follow and its backing records. */
export type FlaggedFollow = {
	did: Did;
	followedAt: string | undefined;
	issues: FollowIssue[];
	profile: AnyProfileView | undefined;
	/** all follow record URIs for this subject. */
	uris: ResourceUri[];
};

export type ScanProgress =
	/** listing follows; total is unknown. */
	| { phase: 'listing'; done: number; total?: undefined }
	/** checking known subjects. */
	| { phase: 'inspecting' | 'resolving'; done: number; total: number };

export type ScanOptions = {
	onProgress: (progress: ScanProgress) => void;
	signal: AbortSignal;
};

type FollowRecords = ListRecordsOutput<'app.bsky.graph.follow'>;

// #endregion

// #region constants

const LIST_PAGE_SIZE = 100;
const FOLLOWS_PAGE_SIZE = 100;
/** max actors per getProfiles request. */
const PROFILES_BATCH_SIZE = 25;
const PROFILES_CONCURRENCY = 4;
const DEAD_LOOKUP_CONCURRENCY = 6;
const NETWORK_RETRIES = 3;
/** guard against cursor loops. */
const MAX_PAGES = 1000;

// #endregion

// #region scanning

const compare = (a: string, b: string): number => {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
};

const blockIssues = (viewer: AppBskyActorDefs.ViewerState | undefined): FollowIssue[] => {
	const issues: FollowIssue[] = [];
	if (viewer?.blockedBy) {
		issues.push('blockedBy');
	}
	if (viewer?.blocking || viewer?.blockingByList) {
		issues.push('blocking');
	}
	return issues;
};

const hostingIssue = (err: unknown): FollowIssue | undefined => {
	if (!(err instanceof ClientResponseError) || err.status !== 400) {
		return undefined;
	}
	switch (err.error) {
		case 'AccountDeactivated': {
			return 'deactivated';
		}
		// suspensions are reported as takedowns.
		case 'AccountTakedown': {
			return 'suspended';
		}
		case 'InvalidRequest': {
			// a missing appview profile does not establish account deletion.
			return err.description === 'Profile not found' ? 'unavailable' : undefined;
		}
		default: {
			return undefined;
		}
	}
};

/**
 * finds follows that are blocked, hidden, unavailable, or point to the current account.
 *
 * @param context appview and PDS clients, repo DID, and shared rate limit budget.
 * @param options progress callback and abort signal.
 * @returns flagged follows, sorted by issue severity, then DID.
 * @throws if scanning fails or an unresolved account cannot be classified.
 */
export async function scanFollows(
	{ appview, budget, did, pds }: { appview: Client; budget: RateLimitBudget; did: Did; pds: Client },
	{ onProgress, signal }: ScanOptions,
): Promise<FlaggedFollow[]> {
	let listed = 0;

	const [records, followed] = await Promise.all([
		accumulate(async (cursor) => {
			// charge each retry separately.
			const data = await networkRetry(NETWORK_RETRIES, () =>
				ok(
					budget.attempt({
						pacing: 'burst',
						request: () =>
							pds.get('com.atproto.repo.listRecords', {
								signal,
								params: {
									repo: did,
									collection: 'app.bsky.graph.follow',
									cursor,
									limit: LIST_PAGE_SIZE,
								},
							}),
						signal,
					}),
				),
			);
			listed += data.records.length;
			onProgress({ phase: 'listing', done: listed });
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the collection determines the record value type
			return { cursor: data.cursor, items: data.records as unknown as FollowRecords['records'] };
		}, MAX_PAGES),
		accumulate(async (cursor) => {
			const data = await networkRetry(NETWORK_RETRIES, () =>
				ok(
					budget.attempt({
						pacing: 'burst',
						request: () =>
							appview.get('app.bsky.graph.getFollows', {
								signal,
								params: { actor: did, cursor, limit: FOLLOWS_PAGE_SIZE },
							}),
						signal,
					}),
				),
			);
			return { cursor: data.cursor, items: data.follows };
		}, MAX_PAGES),
	]);

	// inspect each subject once and delete duplicate records together.
	const subjects = groupByDefined(records, (record) => record.value.subject);
	const visible = new Map(followed.map((profile) => [profile.did, profile]));

	const flagged: FlaggedFollow[] = [];
	const flag = (subject: Did, issues: FollowIssue[], found: { profile: AnyProfileView | undefined }) => {
		const follows = subjects.get(subject)!;
		flagged.push({
			did: subject,
			followedAt: follows[0]!.value.createdAt,
			issues,
			profile: found.profile,
			uris: follows.map((follow) => follow.uri),
		});
	};

	const candidates: Did[] = [];
	for (const subject of subjects.keys()) {
		const profile = visible.get(subject);

		if (subject === did) {
			flag(subject, ['self'], { profile });
		} else if (!profile) {
			candidates.push(subject);
		} else if (profile.labels?.some(labelIsHideableOffense)) {
			// hidden profiles remain in getFollows with a moderation label.
			flag(subject, ['hidden'], { profile });
		}
	}

	// missing profiles are checked in batches to distinguish blocks from unavailable accounts.
	let inspected = 0;
	onProgress({ phase: 'inspecting', done: 0, total: candidates.length });

	const unresolved: Did[] = [];
	const inspect = limitConcurrency(PROFILES_CONCURRENCY, async (batch: Did[]) => {
		signal.throwIfAborted();

		const { profiles } = await networkRetry(NETWORK_RETRIES, () =>
			ok(
				budget.attempt({
					pacing: 'burst',
					request: () => appview.get('app.bsky.actor.getProfiles', { signal, params: { actors: batch } }),
					signal,
				}),
			),
		);

		const returned = new Set(profiles.map((profile) => profile.did));
		for (const profile of profiles) {
			const issues = blockIssues(profile.viewer);
			if (issues.length !== 0) {
				flag(profile.did, issues, { profile });
			}
		}
		for (const subject of batch) {
			if (!returned.has(subject)) {
				unresolved.push(subject);
			}
		}

		inspected += batch.length;
		onProgress({ phase: 'inspecting', done: inspected, total: candidates.length });
	});

	await Promise.all(chunked(candidates, PROFILES_BATCH_SIZE).map((batch) => inspect(batch)));

	// getProfiles omits unavailable accounts; getProfile may provide a more specific status.
	let resolved = 0;
	onProgress({ phase: 'resolving', done: 0, total: unresolved.length });

	// cancel remaining lookups after an unclassified error.
	const lookups = new AbortController();
	const lookupSignal = AbortSignal.any([signal, lookups.signal]);

	const classify = limitConcurrency(DEAD_LOOKUP_CONCURRENCY, async (subject: Did) => {
		lookupSignal.throwIfAborted();

		try {
			const profile = await networkRetry(NETWORK_RETRIES, () =>
				ok(
					budget.attempt({
						pacing: 'burst',
						request: () =>
							appview.get('app.bsky.actor.getProfile', {
								signal: lookupSignal,
								params: { actor: subject },
							}),
						signal: lookupSignal,
					}),
				),
			);
			return { issues: blockIssues(profile.viewer), profile };
		} catch (err) {
			const issue = isAbortError(err) ? undefined : hostingIssue(err);
			// unknown errors are not evidence that the account is gone.
			if (!issue) {
				lookups.abort(err);
				throw err;
			}
			return { issues: [issue], profile: undefined };
		} finally {
			resolved++;
			onProgress({ phase: 'resolving', done: resolved, total: unresolved.length });
		}
	});

	const classified = await Promise.all(
		unresolved.map(async (subject) => ({ found: await classify(subject), subject })),
	);
	for (const { found, subject } of classified) {
		if (found.issues.length !== 0) {
			flag(subject, found.issues, found);
		}
	}

	const severity = (follow: FlaggedFollow) => followIssuesBySeverity.indexOf(follow.issues[0]!);

	flagged.sort((a, b) => severity(a) - severity(b) || compare(a.did, b.did));

	return flagged;
}

// #endregion
