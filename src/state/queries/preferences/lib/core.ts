import type { AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { DEFAULT_LABEL_SETTINGS } from '#/lib/moderation/preferences';
import type { BskyPreferences, LabelVisibility } from '#/lib/moderation/preferences-types';
import { DEFAULT_APP_SPECIFIC_PREF, readAppSpecificPref } from '#/lib/preferences/app-specific-prefs';

/**
 * manages user preferences by communicating directly with the PDS.
 *
 * reads and aggregates {@link BskyPreferences}.
 */

// #region helpers

export type Pref = AppBskyActorDefs.Preferences[number];
export type PrefOf<Type extends Pref['$type']> = Extract<Pref, { $type: Type }>;

/** builds a `$type` discriminant guard for the preference union. */
const prefGuard =
	<Type extends Pref['$type']>(type: Type) =>
	(pref: Pref): pref is PrefOf<Type> =>
		pref.$type === type;

export const isAdultContentPref = prefGuard('app.bsky.actor.defs#adultContentPref');
export const isContentLabelPref = prefGuard('app.bsky.actor.defs#contentLabelPref');
export const isFeedViewPref = prefGuard('app.bsky.actor.defs#feedViewPref');
export const isInterestsPref = prefGuard('app.bsky.actor.defs#interestsPref');
export const isLabelersPref = prefGuard('app.bsky.actor.defs#labelersPref');
export const isMutedWordsPref = prefGuard('app.bsky.actor.defs#mutedWordsPref');
export const isPostInteractionSettingsPref = prefGuard('app.bsky.actor.defs#postInteractionSettingsPref');
export const isSavedFeedsPrefV2 = prefGuard('app.bsky.actor.defs#savedFeedsPrefV2');
export const isThreadViewPref = prefGuard('app.bsky.actor.defs#threadViewPref');
export const isVerificationPrefs = prefGuard('app.bsky.actor.defs#verificationPrefs');

/**
 * returns a copy of `prefs` with every member matching `matches` removed and `replacement` appended.
 *
 * @param prefs the original array of preferences
 * @param matches the element to remove
 * @param replacement the element to append
 * @returns the updated array copy
 */
export const upsertPref = (
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

/** Transforms the legacy `show` visibility to `ignore`. Read-only; not persisted. */
function adjustLegacyContentLabelPref(
	pref: AppBskyActorDefs.ContentLabelPref,
): AppBskyActorDefs.ContentLabelPref {
	return { ...pref, visibility: pref.visibility === 'show' ? 'ignore' : pref.visibility };
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
 * read-modify-write of the raw preferences array, serialized under {@link withPrefsLock}.
 *
 * @param pds the PDS client
 * @param cb maps current preferences to the next set, or false to skip the write
 * @returns the written preferences (or the unchanged ones if aborted)
 */
export async function updatePreferences(
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
 * fetches and derives the user's full preferences.
 *
 * @param pds the PDS client.
 * @param appLabelers the app-level labeler DIDs to seed `moderationPrefs.labelers` with.
 * @param signal aborts the preferences request.
 * @returns the derived, `@atproto`-shaped preferences.
 */
export async function getPreferences(
	pds: Client,
	appLabelers: readonly Did[],
	signal: AbortSignal,
): Promise<BskyPreferences> {
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
		appPrefs: DEFAULT_APP_SPECIFIC_PREF,
		moderationPrefs: {
			adultContentEnabled: false,
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

	const { preferences } = await ok(pds.get('app.bsky.actor.getPreferences', { signal, params: {} }));
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
		} else if (isPostInteractionSettingsPref(pref)) {
			prefs.postInteractionSettings.threadgateAllowRules = pref.threadgateAllowRules;
			prefs.postInteractionSettings.postgateEmbeddingRules = pref.postgateEmbeddingRules;
		} else if (isVerificationPrefs(pref)) {
			prefs.verificationPrefs = { hideBadges: pref.hideBadges ?? false };
		}
	}

	prefs.appPrefs = readAppSpecificPref(preferences);

	// apply the label prefs
	// the lexicon leaves `visibility` open, but the PDS only stores the three `LabelVisibility` values,
	// and `adjustLegacyContentLabelPref` already folded the legacy `show` into `ignore`
	for (const pref of labelPrefs) {
		if (pref.labelerDid) {
			const labeler = prefs.moderationPrefs.labelers.find((candidate) => candidate.did === pref.labelerDid);
			if (!labeler) {
				continue;
			}
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
			labeler.labels[pref.label] = pref.visibility as LabelVisibility;
		} else {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
			prefs.moderationPrefs.labels[pref.label] = pref.visibility as LabelVisibility;
		}
	}

	return prefs;
}

// #endregion
