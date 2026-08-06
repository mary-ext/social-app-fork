import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import { RichText } from '#/components/RichText';

import { useProfileHeader } from './Context';

/** The profile description, rendered unless moderation blurs the profile view. */
export function ProfileHeaderBio({ selectable }: { selectable?: boolean }) {
	const {
		state: { moderation, profile },
	} = useProfileHeader();

	if (
		!profile.description ||
		getDisplayRestrictions(moderation, DisplayContext.ProfileView).blurs.length > 0
	) {
		return null;
	}

	return (
		<RichText
			authorHandle={profile.handle}
			enableTags
			numberOfLines={15}
			selectable={selectable}
			size="md"
			value={profile.description}
		/>
	);
}
