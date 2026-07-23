import type { Did } from '@atcute/lexicons';

import { difference } from '@mary/array-fns';

import { APP_LABELERS, BSKY_LABELER_DID } from '#/lib/moderation/const';

import { account as accountStore } from '#/storage';

import type { SessionAccount } from './types';

let subscribedLabelers: Did[] = [];

/**
 * Sets the user's subscribed labelers.
 *
 * @param dids the subscribed labeler DIDs.
 */
export function setSubscribedLabelers(dids: Did[]): void {
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

export function acceptLabelersHeaderValue(): string {
	if (subscribedLabelers.length === 0) {
		return `${BSKY_LABELER_DID};redact`;
	}

	return `${BSKY_LABELER_DID};redact, ${subscribedLabelers.join(', ')}`;
}
