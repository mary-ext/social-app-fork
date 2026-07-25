import type { RouteTarget } from '#/lib/routes/target';
import { recordUriToTarget } from '#/lib/routes/targets';

import { buildTarget } from '#/routes';

/**
 * the absolute URL for an in-app destination, for sharing it outside the app.
 *
 * @param target the in-app destination
 * @returns the absolute URL on this app's own origin
 */
export const targetToShareUrl = (target: RouteTarget): string => {
	return new URL(buildTarget(target), location.origin).toString();
};

/**
 * the absolute URL for the record an at-uri names.
 *
 * @param uri the record's at-uri
 * @returns the URL, or undefined when the uri is malformed or names a record with no screen here
 */
export const recordUriToShareUrl = (uri: string): string | undefined => {
	const target = recordUriToTarget(uri);
	return target && targetToShareUrl(target);
};
