import type { AnyProfileView } from '@atcute/bluesky';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';

export function createSanitizedDisplayName(
	profile: AnyProfileView,
	noAt = false,
	moderation?: DisplayRestrictions,
) {
	if (profile.displayName != null && profile.displayName !== '') {
		return sanitizeDisplayName(profile.displayName, moderation);
	} else {
		return noAt ? profile.handle : `@${profile.handle}`;
	}
}
