import { ClientResponseError } from '@atcute/client';

import { isRetryableHttpStatus, shouldRetryError } from '#/lib/errors';

import { m } from '#/paraglide/messages';

/**
 * the message to show for a rejected report, or undefined when the failure is not one we recognize and the
 * caller should fall back to its own copy.
 *
 * @param error the thrown value to describe
 * @returns the localized message, or undefined
 */
export function reportErrorMessage(error: unknown): string | undefined {
	if (!(error instanceof ClientResponseError)) {
		return undefined;
	}

	if (error.error === 'AccountTakedown') {
		return m['components.moderation.report.error.accountSuspended']();
	}

	// the labeler's own failures reach us as text, since the appview relays them without a distinct error name
	const description = error.description ?? '';

	if (description.startsWith('Invalid reason type')) {
		return m['components.moderation.report.error.reasonUnsupported']();
	}

	if (description === 'Failed to perform upstream request' || description === 'Internal Server Error') {
		return m['components.moderation.report.error.serviceUnavailable']();
	}

	const upstreamStatus = description.match(/^Upstream server responded with a (\d{3}) error$/)?.[1];
	if (upstreamStatus !== undefined) {
		// a relayed 400 or 404 is the labeler refusing this report, not a blip — retrying changes nothing
		return isRetryableHttpStatus(Number(upstreamStatus))
			? m['components.moderation.report.error.serviceUnavailable']()
			: undefined;
	}

	if (shouldRetryError(error)) {
		return m['components.moderation.report.error.serviceUnavailable']();
	}

	return undefined;
}
