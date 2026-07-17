import type { DisplayRestrictions } from '@atcute/bluesky-moderation';
import type { Handle } from '@atcute/lexicons';

// \u2705 = ✅
// \u2713 = ✓
// \u2714 = ✔
// \u2611 = ☑
const CHECK_MARKS_RE = /[\u2705\u2713\u2714\u2611]/gu;
// oxlint-disable-next-line no-control-regex -- stripping control characters is the point
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const MULTIPLE_SPACES_RE = /[\s][\s\u200B]+/g;

export function sanitizeDisplayName(str: string, moderation?: DisplayRestrictions): string {
	if (moderation && moderation.blurs.length > 0) {
		return '';
	}
	if (typeof str === 'string') {
		return str
			.replace(CHECK_MARKS_RE, '')
			.replace(CONTROL_CHARS_RE, '')
			.replace(MULTIPLE_SPACES_RE, ' ')
			.trim();
	}
	return '';
}

export function combinedDisplayName({
	handle,
	displayName,
}: {
	handle?: Handle;
	displayName?: string;
}): string {
	if (!handle) {
		return '';
	}
	return displayName ? `${sanitizeDisplayName(displayName)} (@${handle})` : `@${handle}`;
}
