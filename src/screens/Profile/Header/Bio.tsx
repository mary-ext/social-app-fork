import { RichText } from '#/components/RichText';

import { useProfileHeader } from './Context';

/** The profile description, rendered unless moderation blurs the profile view. */
export function ProfileHeaderBio({ selectable }: { selectable?: boolean }) {
	const {
		state: { isContentBlurred, profile },
	} = useProfileHeader();

	if (!profile.description || isContentBlurred) {
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
