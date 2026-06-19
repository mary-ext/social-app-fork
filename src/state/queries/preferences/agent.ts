import type { AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';
import * as TID from '@atcute/tid';

import { DEFAULT_LABEL_SETTINGS } from '#/lib/moderation/const';
import type {
	AppBskyActorDefs as AtpActorDefs,
	BskyFeedViewPreference,
	BskyInterestsPreference,
	BskyPreferences,
	BskyThreadViewPreference,
	LabelVisibility,
} from '#/lib/moderation/preferences-types';

/**
 * Fork-owned reimplementation of `@atproto/api`'s `BskyAgent` preference logic, talking to the
 * `@atcute/client` `pds` client directly. `app.bsky.actor.getPreferences` / `putPreferences` are
 * AppView-namespaced but PDS-implemented, so every call here routes through `pds`, never `appview`.
 *
 * The read path derives the fork-owned {@link BskyPreferences} aggregate; its `moderationPrefs` is converted
 * to the engine's `ModerationPreferences` at the boundary (see `#/lib/moderation/prefs`).
 */

// #region helpers

type Pref = AppBskyActorDefs.Preferences[number];
type PrefOf<Type extends Pref['$type']> = Extract<Pref, { $type: Type }>;

/**
 * Builds a `$type` discriminant guard for the preference union. The union members carry a required `$type`,
 * so narrowing with `Extract` yields the precise member (unlike the exported interfaces, whose `$type` is
 * optional).
 */
const prefGuard =
	<Type extends Pref['$type']>(type: Type) =>
	(pref: Pref): pref is PrefOf<Type> =>
		pref.$type === type;

const isAdultContentPref = prefGuard('app.bsky.actor.defs#adultContentPref');
const isContentLabelPref = prefGuard('app.bsky.actor.defs#contentLabelPref');
const isFeedViewPref = prefGuard('app.bsky.actor.defs#feedViewPref');
const isHiddenPostsPref = prefGuard('app.bsky.actor.defs#hiddenPostsPref');
const isInterestsPref = prefGuard('app.bsky.actor.defs#interestsPref');
const isLabelersPref = prefGuard('app.bsky.actor.defs#labelersPref');
const isMutedWordsPref = prefGuard('app.bsky.actor.defs#mutedWordsPref');
const isPostInteractionSettingsPref = prefGuard('app.bsky.actor.defs#postInteractionSettingsPref');
const isSavedFeedsPrefV2 = prefGuard('app.bsky.actor.defs#savedFeedsPrefV2');
const isThreadViewPref = prefGuard('app.bsky.actor.defs#threadViewPref');
const isVerificationPrefs = prefGuard('app.bsky.actor.defs#verificationPrefs');

/**
 * Returns a copy of `prefs` with every member matching `matches` removed and `replacement` appended. Spreads
 * into a fresh array rather than using `Array.concat`, which mis-resolves on the union element type.
 */
const upsertPref = (
	prefs: AppBskyActorDefs.Preferences,
	matches: (pref: Pref) => boolean,
	replacement: Pref,
): AppBskyActorDefs.Preferences => [...prefs.filter((pref) => !matches(pref)), replacement];

const FEED_VIEW_PREF_DEFAULTS = {
	hideQuotePosts: false,
	hideReplies: false,
	hideRepliesByLikeCount: 0,
	hideRepliesByUnfollowed: true,
	hideReposts: false,
};

const THREAD_VIEW_PREF_DEFAULTS = {
	sort: 'hotness',
};

/**
 * Strips whitespace, a leading `#`, and zero-width/soft-hyphen characters from a muted-word value.
 *
 * @param value the raw muted-word value.
 * @returns the sanitized value.
 */
export function sanitizeMutedWordValue(value: string): string {
	return (
		value
			.trim()
			.replace(/^#(?!\ufe0f)/, '')
			// eslint-disable-next-line no-misleading-character-class
			.replace(/[\r\n\u00ad\u2060\u200d\u200c\u200b]+/, '')
	);
}

/**
 * Validates a saved feed: it must carry an `id`, and a `feed`/`list` type must match its URI collection.
 *
 * @param savedFeed the saved feed to validate.
 * @throws if the feed lacks an `id` or its type does not match its URI collection.
 */
function validateSavedFeed(savedFeed: AppBskyActorDefs.SavedFeed): void {
	if (!savedFeed.id) {
		throw new Error('Saved feed must have an `id` - use a TID');
	}

	if (savedFeed.type === 'feed' || savedFeed.type === 'list') {
		const collection = parseResourceUri(savedFeed.value).collection;
		const isFeed = collection === 'app.bsky.feed.generator';
		const isList = collection === 'app.bsky.graph.list';

		if (savedFeed.type === 'feed' && !isFeed) {
			throw new Error(`Saved feed of type 'feed' must be a feed, got ${collection}`);
		}
		if (savedFeed.type === 'list' && !isList) {
			throw new Error(`Saved feed of type 'list' must be a list, got ${collection}`);
		}
	}
}

/** Stamps a TID `id` onto any legacy muted words that predate the `id` field. */
function migrateLegacyMutedWordsItems(
	items: readonly AppBskyActorDefs.MutedWord[],
): AppBskyActorDefs.MutedWord[] {
	return items.map((item) => ({ ...item, id: item.id || TID.now() }));
}

/** Matches a stored muted word against an incoming one, preferring `id` and falling back to value (legacy). */
function matchMutedWord(
	existingWord: { id?: string; value: string },
	newWord: { id?: string; value: string },
): boolean {
	// id is undefined in legacy implementation
	const existingId = existingWord.id;
	// prefer matching based on id
	const matchById = existingId && existingId === newWord.id;
	// handle legacy case where id is not set
	const legacyMatchByValue = !existingId && existingWord.value === newWord.value;

	return Boolean(matchById || legacyMatchByValue);
}

/** Transforms the legacy `show` visibility to `ignore`. Read-only; not persisted. */
function adjustLegacyContentLabelPref(
	pref: AppBskyActorDefs.ContentLabelPref,
): AppBskyActorDefs.ContentLabelPref {
	return { ...pref, visibility: pref.visibility === 'show' ? 'ignore' : pref.visibility };
}

/** Re-maps legacy label names to their modern equivalents on read. Does not persist. */
function remapLegacyLabels(
	labels: BskyPreferences['moderationPrefs']['labels'],
): BskyPreferences['moderationPrefs']['labels'] {
	const remapped = { ...labels };
	const legacyToNewMap: Record<string, string | undefined> = {
		gore: 'graphic-media',
		nsfw: 'porn',
		suggestive: 'sexual',
	};

	for (const labelName in remapped) {
		const newLabelName = legacyToNewMap[labelName];
		if (newLabelName) {
			remapped[newLabelName] = remapped[labelName]!;
		}
	}

	return remapped;
}

// #endregion

// #region read + write core

/**
 * Serializes preference writes process-wide. `@atproto/api` used an `AwaitLock` on the singleton agent; this
 * promise-chain mutex keeps concurrent read-modify-write cycles from clobbering each other.
 */
let prefsLock: Promise<void> = Promise.resolve();

async function withPrefsLock<T>(fn: () => Promise<T>): Promise<T> {
	const prev = prefsLock;
	let release!: () => void;
	prefsLock = new Promise((resolve) => {
		release = resolve;
	});
	await prev;
	try {
		return await fn();
	} finally {
		release();
	}
}

/**
 * Read-modify-write of the raw preferences array, serialized under {@link withPrefsLock}. Always sends the
 * full array back. Returning `false` from `cb` aborts the write.
 *
 * @param pds the PDS client.
 * @param cb maps the current preferences to the next set, or `false` to skip the write.
 * @returns the written preferences (or the unchanged ones when `cb` returns `false`).
 */
async function updatePreferences(
	pds: Client,
	cb: (prefs: AppBskyActorDefs.Preferences) => AppBskyActorDefs.Preferences | false,
): Promise<AppBskyActorDefs.Preferences> {
	return withPrefsLock(async () => {
		const { preferences } = await ok(pds.get('app.bsky.actor.getPreferences', { params: {} }));
		const newPrefs = cb(preferences);
		if (newPrefs === false) {
			return preferences;
		}
		await ok(pds.post('app.bsky.actor.putPreferences', { as: null, input: { preferences: newPrefs } }));
		return newPrefs;
	});
}

/**
 * Fetches and derives the user's full preferences, mirroring `@atproto/api`'s `BskyAgent.getPreferences`.
 * Reads the raw pref array from the PDS, narrows each item by `$type`, and applies legacy-label remapping.
 * Unlike `@atproto/api`, it does not migrate a legacy v1 `savedFeedsPref` into v2 — the fork assumes a
 * `savedFeedsPrefV2` already exists.
 *
 * @param pds the PDS client.
 * @param appLabelers the app-level labeler DIDs to seed `moderationPrefs.labelers` with.
 * @returns the derived, `@atproto`-shaped preferences.
 */
export async function getPreferences(pds: Client, appLabelers: readonly string[]): Promise<BskyPreferences> {
	const prefs: BskyPreferences = {
		feedViewPrefs: {
			home: { ...FEED_VIEW_PREF_DEFAULTS },
		},
		feeds: {
			pinned: undefined,
			saved: undefined,
		},
		interests: {
			tags: [],
		},
		moderationPrefs: {
			adultContentEnabled: false,
			hiddenPosts: [],
			labelers: appLabelers.map((did) => ({ did, labels: {} })),
			labels: { ...DEFAULT_LABEL_SETTINGS },
			mutedWords: [],
		},
		postInteractionSettings: {
			postgateEmbeddingRules: undefined,
			threadgateAllowRules: undefined,
		},
		savedFeeds: [],
		threadViewPrefs: { ...THREAD_VIEW_PREF_DEFAULTS },
		verificationPrefs: {
			hideBadges: false,
		},
	};

	const { preferences } = await ok(pds.get('app.bsky.actor.getPreferences', { params: {} }));
	const labelPrefs: AppBskyActorDefs.ContentLabelPref[] = [];

	for (const pref of preferences) {
		if (isAdultContentPref(pref)) {
			prefs.moderationPrefs.adultContentEnabled = pref.enabled ?? false;
		} else if (isContentLabelPref(pref)) {
			labelPrefs.push(adjustLegacyContentLabelPref(pref));
		} else if (isLabelersPref(pref)) {
			prefs.moderationPrefs.labelers = appLabelers
				.map((did) => ({ did, labels: {} }))
				.concat(pref.labelers.map((labeler) => ({ did: labeler.did, labels: {} })));
		} else if (isSavedFeedsPrefV2(pref)) {
			prefs.savedFeeds = pref.items;
		} else if (isFeedViewPref(pref)) {
			const { $type: _, feed, ...v } = pref;
			prefs.feedViewPrefs[feed] = { ...FEED_VIEW_PREF_DEFAULTS, ...v };
		} else if (isThreadViewPref(pref)) {
			const { $type: _, ...v } = pref;
			prefs.threadViewPrefs = { ...prefs.threadViewPrefs, ...v };
		} else if (isInterestsPref(pref)) {
			const { $type: _, ...v } = pref;
			prefs.interests = { ...prefs.interests, ...v };
		} else if (isMutedWordsPref(pref)) {
			prefs.moderationPrefs.mutedWords = pref.items.map((word) => ({
				...word,
				actorTarget: word.actorTarget || 'all',
			}));
		} else if (isHiddenPostsPref(pref)) {
			prefs.moderationPrefs.hiddenPosts = [...pref.items];
		} else if (isPostInteractionSettingsPref(pref)) {
			prefs.postInteractionSettings.threadgateAllowRules = pref.threadgateAllowRules;
			prefs.postInteractionSettings.postgateEmbeddingRules = pref.postgateEmbeddingRules;
		} else if (isVerificationPrefs(pref)) {
			prefs.verificationPrefs = { hideBadges: pref.hideBadges ?? false };
		}
	}

	// apply the label prefs
	for (const pref of labelPrefs) {
		if (pref.labelerDid) {
			const labeler = prefs.moderationPrefs.labelers.find((labeler) => labeler.did === pref.labelerDid);
			if (!labeler) continue;
			labeler.labels[pref.label] = pref.visibility as LabelVisibility;
		} else {
			prefs.moderationPrefs.labels[pref.label] = pref.visibility as LabelVisibility;
		}
	}

	prefs.moderationPrefs.labels = remapLegacyLabels(prefs.moderationPrefs.labels);

	return prefs;
}

/**
 * Clears all preferences by writing an empty array. Used to reset an account's preference state.
 *
 * @param pds the PDS client.
 */
export async function clearPreferences(pds: Client): Promise<void> {
	await ok(pds.post('app.bsky.actor.putPreferences', { as: null, input: { preferences: [] } }));
}

// #endregion

// #region saved feeds

/**
 * Read-modify-write of the v2 saved-feeds pref, enforcing pinned-first ordering. The legacy v1
 * `savedFeedsPref` is not written (the v1 double-write `@atproto/api` performed was dropped).
 *
 * @param pds the PDS client.
 * @param cb maps the current saved feeds to the next set.
 * @returns the saved feeds returned by `cb` (pre-sort).
 */
async function updateSavedFeedsV2Preferences(
	pds: Client,
	cb: (savedFeeds: AppBskyActorDefs.SavedFeed[]) => AppBskyActorDefs.SavedFeed[],
): Promise<AppBskyActorDefs.SavedFeed[]> {
	let maybeMutatedSavedFeeds: AppBskyActorDefs.SavedFeed[] = [];

	await updatePreferences(pds, (prefs) => {
		const existingV2Items = [...(prefs.findLast(isSavedFeedsPrefV2)?.items ?? [])];
		const newSavedFeeds = cb(existingV2Items);
		maybeMutatedSavedFeeds = newSavedFeeds;

		const nextV2: PrefOf<'app.bsky.actor.defs#savedFeedsPrefV2'> = {
			$type: 'app.bsky.actor.defs#savedFeedsPrefV2',
			// enforce ordering: pinned first, then saved (preserving order within each group)
			items: [...newSavedFeeds].sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1)),
		};

		return upsertPref(prefs, isSavedFeedsPrefV2, nextV2);
	});

	return maybeMutatedSavedFeeds;
}

/**
 * Replaces the entire saved-feeds set, de-duplicating by `id` while preserving order.
 *
 * @param pds the PDS client.
 * @param savedFeeds the saved feeds to write.
 */
export async function overwriteSavedFeeds(pds: Client, savedFeeds: AtpActorDefs.SavedFeed[]): Promise<void> {
	savedFeeds.forEach(validateSavedFeed);
	const uniqueSavedFeeds = new Map<string, AppBskyActorDefs.SavedFeed>();
	savedFeeds.forEach((feed) => {
		// remove and re-insert to preserve order
		if (uniqueSavedFeeds.has(feed.id)) {
			uniqueSavedFeeds.delete(feed.id);
		}
		uniqueSavedFeeds.set(feed.id, feed);
	});
	await updateSavedFeedsV2Preferences(pds, () => Array.from(uniqueSavedFeeds.values()));
}

/**
 * Updates the `pinned` flag of existing saved feeds (matched by `id`); other fields are left untouched.
 *
 * @param pds the PDS client.
 * @param savedFeedsToUpdate the saved feeds whose `pinned` flag should be applied.
 */
export async function updateSavedFeeds(
	pds: Client,
	savedFeedsToUpdate: AtpActorDefs.SavedFeed[],
): Promise<void> {
	savedFeedsToUpdate.forEach(validateSavedFeed);
	await updateSavedFeedsV2Preferences(pds, (savedFeeds) =>
		savedFeeds.map((savedFeed) => {
			const updatedVersion = savedFeedsToUpdate.find((updated) => savedFeed.id === updated.id);
			if (updatedVersion) {
				// only update pinned
				return { ...savedFeed, pinned: updatedVersion.pinned };
			}
			return savedFeed;
		}),
	);
}

/**
 * Appends new saved feeds, assigning each a fresh TID `id`.
 *
 * @param pds the PDS client.
 * @param savedFeeds the feeds to add.
 */
export async function addSavedFeeds(
	pds: Client,
	savedFeeds: Pick<AtpActorDefs.SavedFeed, 'pinned' | 'type' | 'value'>[],
): Promise<void> {
	const toSave: AppBskyActorDefs.SavedFeed[] = savedFeeds.map((f) => ({ ...f, id: TID.now() }));
	toSave.forEach(validateSavedFeed);
	await updateSavedFeedsV2Preferences(pds, (savedFeeds) => [...savedFeeds, ...toSave]);
}

/**
 * Removes saved feeds by `id`.
 *
 * @param pds the PDS client.
 * @param ids the saved-feed `id`s to remove.
 */
export async function removeSavedFeeds(pds: Client, ids: string[]): Promise<void> {
	await updateSavedFeedsV2Preferences(pds, (savedFeeds) =>
		savedFeeds.filter((feed) => !ids.includes(feed.id)),
	);
}

// #endregion

// #region content moderation prefs

/**
 * Toggles the adult-content preference.
 *
 * @param pds the PDS client.
 * @param enabled whether adult content is enabled.
 */
export async function setAdultContentEnabled(pds: Client, enabled: boolean): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const next: PrefOf<'app.bsky.actor.defs#adultContentPref'> = {
			$type: 'app.bsky.actor.defs#adultContentPref',
			enabled,
		};
		return upsertPref(prefs, isAdultContentPref, next);
	});
}

/**
 * Sets a content-label visibility preference, optionally scoped to a labeler. Global changes to a label with
 * a legacy alias (`graphic-media`/`porn`/`sexual`) are double-written to the legacy label.
 *
 * @param pds the PDS client.
 * @param key the label identifier.
 * @param value the desired visibility.
 * @param labelerDid the labeler the preference applies to, or undefined for a global preference.
 */
export async function setContentLabelPref(
	pds: Client,
	key: string,
	value: LabelVisibility,
	labelerDid?: string,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const labelPref: PrefOf<'app.bsky.actor.defs#contentLabelPref'> = {
			$type: 'app.bsky.actor.defs#contentLabelPref',
			label: key,
			labelerDid: labelerDid as Did | undefined,
			visibility: value,
		};

		let legacyLabelPref: PrefOf<'app.bsky.actor.defs#contentLabelPref'> | undefined;
		// global (non-labeler) prefs for labels with a legacy alias get double-written. a Map keeps
		// prototype keys (toString, hasOwnProperty, ...) from ever matching as a label.
		if (!labelerDid) {
			const legacyLabelValue = new Map([
				['graphic-media', 'gore'],
				['porn', 'nsfw'],
				['sexual', 'suggestive'],
			]).get(key);

			if (legacyLabelValue) {
				legacyLabelPref = {
					$type: 'app.bsky.actor.defs#contentLabelPref',
					label: legacyLabelValue,
					labelerDid: undefined,
					visibility: value,
				};
			}
		}

		let next = upsertPref(
			prefs,
			(pref) => isContentLabelPref(pref) && pref.label === key && pref.labelerDid === labelerDid,
			labelPref,
		);

		if (legacyLabelPref) {
			const legacyLabel = legacyLabelPref.label;
			next = upsertPref(
				next,
				(pref) => isContentLabelPref(pref) && pref.label === legacyLabel && pref.labelerDid === undefined,
				legacyLabelPref,
			);
		}

		return next;
	});
}

/**
 * Replaces the muted-words list with the provided words (matched/removed by `id`, falling back to value).
 * Adds new words with a fresh TID `id`; sanitizes values and drops any that sanitize to empty.
 *
 * @param pds the PDS client.
 * @param mutedWords the words to add.
 */
export async function upsertMutedWords(
	pds: Client,
	mutedWords: Pick<AtpActorDefs.MutedWord, 'actorTarget' | 'expiresAt' | 'targets' | 'value'>[],
): Promise<void> {
	const newWords: AppBskyActorDefs.MutedWord[] = [];
	for (const mutedWord of mutedWords) {
		const sanitizedValue = sanitizeMutedWordValue(mutedWord.value);
		if (!sanitizedValue) continue;
		newWords.push({
			actorTarget: mutedWord.actorTarget || 'all',
			expiresAt: mutedWord.expiresAt || undefined,
			id: TID.now(),
			targets: mutedWord.targets || [],
			value: sanitizedValue,
		});
	}

	if (!newWords.length) return;

	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isMutedWordsPref);
		const items = migrateLegacyMutedWordsItems([...(existing?.items ?? []), ...newWords]);
		const next: PrefOf<'app.bsky.actor.defs#mutedWordsPref'> = {
			$type: 'app.bsky.actor.defs#mutedWordsPref',
			items,
		};
		return upsertPref(prefs, isMutedWordsPref, next);
	});
}

/**
 * Updates a stored muted word, re-sanitizing its value and re-stamping legacy items with `id`s.
 *
 * @param pds the PDS client.
 * @param mutedWord the muted word to update (matched by `id`, falling back to value).
 */
export async function updateMutedWord(pds: Client, mutedWord: AtpActorDefs.MutedWord): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isMutedWordsPref);
		if (!existing) return prefs;

		const updatedItems = existing.items.map((existingItem) => {
			if (!matchMutedWord(existingItem, mutedWord)) {
				return existingItem;
			}
			const updated = { ...existingItem, ...mutedWord };
			return {
				actorTarget: updated.actorTarget || 'all',
				expiresAt: updated.expiresAt || undefined,
				id: existingItem.id || TID.now(),
				targets: updated.targets || [],
				value: sanitizeMutedWordValue(updated.value) || existingItem.value,
			};
		});

		const next: PrefOf<'app.bsky.actor.defs#mutedWordsPref'> = {
			$type: 'app.bsky.actor.defs#mutedWordsPref',
			items: migrateLegacyMutedWordsItems(updatedItems),
		};
		return upsertPref(prefs, isMutedWordsPref, next);
	});
}

/**
 * Removes a stored muted word.
 *
 * @param pds the PDS client.
 * @param mutedWord the muted word to remove (matched by `id`, falling back to value).
 */
export async function removeMutedWord(pds: Client, mutedWord: AtpActorDefs.MutedWord): Promise<void> {
	await removeMutedWords(pds, [mutedWord]);
}

/**
 * Removes stored muted words.
 *
 * @param pds the PDS client.
 * @param mutedWords the muted words to remove (each matched by `id`, falling back to value).
 */
export async function removeMutedWords(pds: Client, mutedWords: AtpActorDefs.MutedWord[]): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isMutedWordsPref);
		if (!existing) return prefs;

		// each removal target removes a single matching stored item: for legacy (no-id) words that
		// match by value, this avoids dropping other entries that happen to share the same value
		const remaining = [...existing.items];
		for (const target of mutedWords) {
			const index = remaining.findIndex((item) => matchMutedWord(item, target));
			if (index !== -1) {
				remaining.splice(index, 1);
			}
		}

		const next: PrefOf<'app.bsky.actor.defs#mutedWordsPref'> = {
			$type: 'app.bsky.actor.defs#mutedWordsPref',
			items: migrateLegacyMutedWordsItems(remaining),
		};
		return upsertPref(prefs, isMutedWordsPref, next);
	});
}

// #endregion

// #region labeler subscriptions

/**
 * Adds a labeler subscription to the labelers preference, de-duplicating by DID.
 *
 * @param pds the PDS client.
 * @param did the labeler DID to subscribe to.
 */
export async function addLabeler(pds: Client, did: string): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isLabelersPref)?.labelers ?? [];
		const next: PrefOf<'app.bsky.actor.defs#labelersPref'> = {
			$type: 'app.bsky.actor.defs#labelersPref',
			labelers: [...existing.filter((labeler) => labeler.did !== did), { did: did as Did }],
		};
		return upsertPref(prefs, isLabelersPref, next);
	});
}

/**
 * Removes a labeler subscription from the labelers preference.
 *
 * @param pds the PDS client.
 * @param did the labeler DID to unsubscribe from.
 */
export async function removeLabeler(pds: Client, did: string): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isLabelersPref)?.labelers ?? [];
		const next: PrefOf<'app.bsky.actor.defs#labelersPref'> = {
			$type: 'app.bsky.actor.defs#labelersPref',
			labelers: existing.filter((labeler) => labeler.did !== did),
		};
		return upsertPref(prefs, isLabelersPref, next);
	});
}

// #endregion

// #region view + account prefs

/**
 * Sets feed-view preferences for a given feed, merging over any existing values.
 *
 * @param pds the PDS client.
 * @param feed the feed URI or identifier (`'home'` for the following feed).
 * @param pref the feed-view fields to apply.
 */
export async function setFeedViewPrefs(
	pds: Client,
	feed: string,
	pref: Partial<BskyFeedViewPreference>,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.filter(isFeedViewPref).findLast((p) => p.feed === feed);
		const next: PrefOf<'app.bsky.actor.defs#feedViewPref'> = {
			...existing,
			...(pref as Partial<AppBskyActorDefs.FeedViewPref>),
			$type: 'app.bsky.actor.defs#feedViewPref',
			feed,
		};
		return upsertPref(prefs, (p) => isFeedViewPref(p) && p.feed === feed, next);
	});
}

/**
 * Sets thread-view preferences, merging over any existing values.
 *
 * @param pds the PDS client.
 * @param pref the thread-view fields to apply.
 */
export async function setThreadViewPrefs(
	pds: Client,
	pref: Partial<BskyThreadViewPreference>,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isThreadViewPref);
		const next: PrefOf<'app.bsky.actor.defs#threadViewPref'> = {
			...existing,
			...(pref as Partial<AppBskyActorDefs.ThreadViewPref>),
			$type: 'app.bsky.actor.defs#threadViewPref',
		};
		return upsertPref(prefs, isThreadViewPref, next);
	});
}

/**
 * Sets the onboarding interests preference, merging over any existing values.
 *
 * @param pds the PDS client.
 * @param pref the interests fields to apply.
 */
export async function setInterestsPref(pds: Client, pref: Partial<BskyInterestsPreference>): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isInterestsPref);
		const next: PrefOf<'app.bsky.actor.defs#interestsPref'> = {
			$type: 'app.bsky.actor.defs#interestsPref',
			tags: pref.tags ?? existing?.tags ?? [],
		};
		return upsertPref(prefs, isInterestsPref, next);
	});
}

/**
 * Sets the default post-interaction settings (threadgate/postgate rules) applied to new posts.
 *
 * @param pds the PDS client.
 * @param settings the post-interaction settings to apply.
 */
export async function setPostInteractionSettings(
	pds: Client,
	settings: AtpActorDefs.PostInteractionSettingsPref,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isPostInteractionSettingsPref);
		const next: PrefOf<'app.bsky.actor.defs#postInteractionSettingsPref'> = {
			...existing,
			$type: 'app.bsky.actor.defs#postInteractionSettingsPref',
			// Matches handling of `threadgate.allow` where `undefined` means "everyone"
			postgateEmbeddingRules: settings.postgateEmbeddingRules,
			threadgateAllowRules: settings.threadgateAllowRules,
		};
		return upsertPref(prefs, isPostInteractionSettingsPref, next);
	});
}

/**
 * Sets the verification-badge preferences.
 *
 * @param pds the PDS client.
 * @param settings the verification preferences to apply.
 */
export async function setVerificationPrefs(
	pds: Client,
	settings: AtpActorDefs.VerificationPrefs,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const next: PrefOf<'app.bsky.actor.defs#verificationPrefs'> = {
			$type: 'app.bsky.actor.defs#verificationPrefs',
			hideBadges: settings.hideBadges,
		};
		return upsertPref(prefs, isVerificationPrefs, next);
	});
}

// #endregion
