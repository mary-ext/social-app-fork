import type { Did } from '@atcute/lexicons';

import { difference } from '@mary/array-fns';

import { APP_LABELERS, BSKY_LABELER_DID } from '#/lib/moderation/const';

import { account as accountStore } from '#/storage';

import type { SessionAccount } from './types';

let subscribedLabelers: Did[] = [];

function setSubscribedLabelers(dids: Did[]): void {
	subscribedLabelers = difference(dids, APP_LABELERS);
}

/** configures moderation labelers for a guest session. */
export function configureModerationForGuest(): void {
	setSubscribedLabelers([]);
}

/** configures moderation labelers for an account session. */
export function configureModerationForAccount(account: SessionAccount): void {
	const labelerDids = accountStore.get([account.did, 'labelers']);
	setSubscribedLabelers(labelerDids ?? []);
}

/** persists an account's labelers and applies them to the current session. */
export function saveSubscribedLabelers(did: Did, dids: Did[]): void {
	// persist before preferences refetches.
	accountStore.set([did, 'labelers'], dids);
	// update request headers immediately.
	setSubscribedLabelers(dids);
}

export function acceptLabelersHeaderValue(): string {
	if (subscribedLabelers.length === 0) {
		return `${BSKY_LABELER_DID};redact`;
	}

	return `${BSKY_LABELER_DID};redact, ${subscribedLabelers.join(', ')}`;
}
