import type { Did } from '@atcute/lexicons';

import { difference } from '@mary/array-fns';

import { APP_LABELERS, BSKY_LABELER_DID } from '#/lib/moderation/const';

import { account as accountStore } from '#/storage';

import type { SessionAccount } from './types';

let subscribedLabelers: Did[] = [];

function setSubscribedLabelers(dids: Did[]): void {
	subscribedLabelers = difference(dids, APP_LABELERS);
}

/** Configures moderation labelers for a guest session. */
export function configureModerationForGuest(): void {
	setSubscribedLabelers([]);
}

/**
 * Configures moderation labelers for an account session.
 *
 * @param account session account info.
 */
export function configureModerationForAccount(account: SessionAccount): void {
	const labelerDids = accountStore.get([account.did, 'labelers']);
	setSubscribedLabelers(labelerDids ?? []);
}

/**
 * persists an account's subscribed labelers and applies them to the current session.
 *
 * @param did the account the labelers belong to
 * @param dids the subscribed labeler DIDs
 */
export function saveSubscribedLabelers(did: Did, dids: Did[]): void {
	// persisted so a later session already has labelers on its initial requests, before the
	// preferences query gets a chance to refetch them
	accountStore.set([did, 'labelers'], dids);
	// keep the appview client's labeler header in sync with the freshly fetched prefs, as
	// `agent.getPreferences()` used to do internally
	setSubscribedLabelers(dids);
}

export function acceptLabelersHeaderValue(): string {
	if (subscribedLabelers.length === 0) {
		return `${BSKY_LABELER_DID};redact`;
	}

	return `${BSKY_LABELER_DID};redact, ${subscribedLabelers.join(', ')}`;
}
