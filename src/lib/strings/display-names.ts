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

/**
 * the name to show for a profile: its sanitized display name, falling back to the handle when the profile has
 * no display name.
 *
 * moderation applies only to the display name — a profile whose display name is blurred renders as empty
 * rather than falling back to the handle.
 *
 * @param profile the profile to name
 * @param options `bareHandle` drops the `@` from the handle fallback; `moderation` blurs the display name
 * @returns the display name, the handle, or an empty string when moderation blurs the name
 */
export function profileDisplayName(
	profile: { displayName?: string; handle: Handle },
	options?: { bareHandle?: boolean; moderation?: DisplayRestrictions },
): string {
	if (profile.displayName) {
		return sanitizeDisplayName(profile.displayName, options?.moderation);
	}
	return options?.bareHandle ? profile.handle : `@${profile.handle}`;
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
