import type { Did } from '@atcute/lexicons';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';

/**
 * labelers the AppView and chat clients advertise via the `atproto-accept-labelers` header. kept as mutable
 * state so subscription changes are reflected on the next request.
 */

// App labelers are sent with `;redact`; subscribed labelers are sent plain.
let appLabelers: Did[] = [BSKY_LABELER_DID];
let subscribedLabelers: Did[] = [];

/**
 * Sets the app-level labelers, sent with the `;redact` directive.
 *
 * @param dids the app labeler DIDs.
 */
export function setAppLabelers(dids: Did[]): void {
	appLabelers = dids;
}

/**
 * Sets the user's subscribed labelers, sent without a directive.
 *
 * @param dids the subscribed labeler DIDs.
 */
export function setSubscribedLabelers(dids: Did[]): void {
	subscribedLabelers = dids;
}

/**
 * Builds the current `atproto-accept-labelers` header value from the configured labelers.
 *
 * @returns the comma-separated header value.
 */
export function acceptLabelersHeaderValue(): string {
	return [...appLabelers.map((did) => `${did};redact`), ...subscribedLabelers].join(', ');
}
