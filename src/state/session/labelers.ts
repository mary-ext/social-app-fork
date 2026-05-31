import { BSKY_LABELER_DID } from '#/lib/moderation/const';

/**
 * The labelers the AppView and chat clients advertise via the `atproto-accept-labelers` header. Kept as
 * module-level mutable state so a subscription change is reflected on the next request without rebuilding the
 * client — mirroring how `@atproto/api`'s `Agent` merged app and instance labelers into its requests.
 */

// App labelers are sent with `;redact`; subscribed labelers are sent plain.
let appLabelers: string[] = [BSKY_LABELER_DID];
let subscribedLabelers: string[] = [];

/**
 * Sets the app-level labelers, sent with the `;redact` directive.
 *
 * @param dids the app labeler DIDs.
 */
export function setAppLabelers(dids: string[]): void {
	appLabelers = dids;
}

/**
 * Sets the user's subscribed labelers, sent without a directive.
 *
 * @param dids the subscribed labeler DIDs.
 */
export function setSubscribedLabelers(dids: string[]): void {
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
