import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';
import * as TID from '@atcute/tid';

import { mapDefined } from '@mary-ext/array-fns';

import { sanitizeMutedWordValue } from '#/lib/preferences/muted-words';

import {
	isMutedWordsPref,
	type PrefOf,
	updatePreferences,
	upsertPref,
} from '#/state/queries/preferences/lib/core';

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
	const hasId = !!existingId;
	// prefer matching based on id
	const matchById = hasId && existingId === newWord.id;
	// handle legacy case where id is not set
	const legacyMatchByValue = !hasId && existingWord.value === newWord.value;

	return matchById || legacyMatchByValue;
}

/**
 * replaces the muted-words list with the provided words.
 *
 * @param pds the PDS client
 * @param mutedWords the words to add
 */
export async function upsertMutedWords(
	pds: Client,
	mutedWords: Pick<AppBskyActorDefs.MutedWord, 'actorTarget' | 'expiresAt' | 'targets' | 'value'>[],
): Promise<void> {
	const newWords = mapDefined(mutedWords, (mutedWord): AppBskyActorDefs.MutedWord | undefined => {
		const sanitizedValue = sanitizeMutedWordValue(mutedWord.value);
		if (!sanitizedValue) {
			return;
		}

		return {
			actorTarget: mutedWord.actorTarget || 'all',
			expiresAt: mutedWord.expiresAt || undefined,
			id: TID.now(),
			targets: mutedWord.targets || [],
			value: sanitizedValue,
		};
	});

	if (!newWords.length) {
		return;
	}

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
export async function updateMutedWord(pds: Client, mutedWord: AppBskyActorDefs.MutedWord): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isMutedWordsPref);
		if (!existing) {
			return prefs;
		}

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
export async function removeMutedWord(pds: Client, mutedWord: AppBskyActorDefs.MutedWord): Promise<void> {
	await removeMutedWords(pds, [mutedWord]);
}

/**
 * Removes stored muted words.
 *
 * @param pds the PDS client.
 * @param mutedWords the muted words to remove (each matched by `id`, falling back to value).
 */
export async function removeMutedWords(pds: Client, mutedWords: AppBskyActorDefs.MutedWord[]): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isMutedWordsPref);
		if (!existing) {
			return prefs;
		}

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
