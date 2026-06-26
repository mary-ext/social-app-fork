import type { AppBskyActorDefs, AppBskyLabelerDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import { LabelerProfileHeader } from './Labeler';
import { ProfileHeaderSkeleton } from './Skeleton';
import { StandardProfileHeader } from './Standard';

interface Props {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined;
	descriptionRT: Richtext | null;
	moderationOpts: ModerationOptions;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
	setMinimumHeight: (height: number) => void;
}

/** Routes to the labeler or standard header variant; `setMinimumHeight` is a no-op on web. */
export function ProfileHeader({ setMinimumHeight, ...props }: Props): React.ReactNode {
	if (props.profile.associated?.labeler) {
		if (!props.labeler) {
			return <ProfileHeaderSkeleton />;
		}
		return <LabelerProfileHeader {...props} labeler={props.labeler} />;
	}
	return <StandardProfileHeader {...props} />;
}

export { ProfileHeaderSkeleton } from './Skeleton';
