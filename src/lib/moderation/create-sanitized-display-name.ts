import type { AnyProfileView } from '@atcute/bluesky';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

export function createSanitizedDisplayName(
	profile: AnyProfileView,
	noAt = false,
	moderation?: DisplayRestrictions,
) {
	if (profile.displayName != null && profile.displayName !== '') {
		return sanitizeDisplayName(profile.displayName, moderation);
	} else {
		return sanitizeHandle(profile.handle, noAt ? '' : '@');
	}
}
