import type { Handle } from '@atcute/lexicons';

import { sanitizeDisplayName } from '#/lib/strings/display-names';

export function getUserDisplayName(props: { displayName?: string; handle: Handle }): string {
	return sanitizeDisplayName(props.displayName || `@${props.handle}`);
}
