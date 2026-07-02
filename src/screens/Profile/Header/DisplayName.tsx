import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useBreakpoints } from '#/alf';

import { Text } from '#/components/Text';

import { useProfileHeader } from './Context';
import * as css from './DisplayName.css';

/** The large profile display name. The standard header tightens its leading via `tight`. */
export function ProfileHeaderDisplayName({ tight = false }: { tight?: boolean }) {
	const { gtMobile } = useBreakpoints();
	const {
		state: { moderation, profile },
	} = useProfileHeader();

	return (
		<Text
			className={tight ? css.displayNameTight : undefined}
			color="text"
			size={gtMobile ? '_4xl' : '_3xl'}
			weight="bold"
		>
			{sanitizeDisplayName(
				profile.displayName || profile.handle,
				getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
			)}
		</Text>
	);
}
