import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useBreakpoints } from '#/alf';

import { Text } from '#/components/web/Text';

import { useProfileHeader } from './Context';
import * as css from './DisplayName.css';

/** The large profile display name. `leading` defaults to `snug`; the standard header tightens it. */
export function ProfileHeaderDisplayName({ leading = 'snug' }: { leading?: 'snug' | 'tight' }) {
	const { gtMobile } = useBreakpoints();
	const {
		state: { moderation, profile },
	} = useProfileHeader();

	return (
		<Text
			className={css.displayName}
			color="text"
			leading={leading}
			size={gtMobile ? '_4xl' : '_3xl'}
			weight="bold"
		>
			{sanitizeDisplayName(
				profile.displayName || sanitizeHandle(profile.handle),
				getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
			)}
		</Text>
	);
}
