import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import { RichText } from '#/components/web/RichText';

import { useProfileHeader } from './Context';

/** The profile description, rendered unless moderation blurs the profile view. */
export function ProfileHeaderBio({ selectable }: { selectable?: boolean }) {
	const {
		state: { descriptionRT, moderation, profile },
	} = useProfileHeader();

	if (!descriptionRT || getDisplayRestrictions(moderation, DisplayContext.ProfileView).blurs.length > 0) {
		return null;
	}

	return (
		<RichText
			authorHandle={profile.handle}
			enableTags
			numberOfLines={15}
			selectable={selectable}
			size="md"
			value={descriptionRT}
		/>
	);
}
