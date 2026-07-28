import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import { ProfileBadges } from '#/components/ProfileBadges';
import { KnownFollowers, shouldShowKnownFollowers } from '#/components/web/KnownFollowers';

import { GermButton } from '../components/GermButton';
import { LabelerButton } from '../components/LabelerButton';
import { ProfileHeaderActions } from './Actions';
import { ProfileHeaderBio } from './Bio';
import { ProfileHeaderProvider, useProfileHeader } from './Context';
import { ProfileHeaderDisplayName } from './DisplayName';
import { ProfileHeaderHandle } from './Handle';
import * as css from './index.css';
import { ProfileHeaderMetrics } from './Metrics';
import { ProfileHeaderShell } from './Shell';
import { ProfileHeaderSuggestedFollows } from './SuggestedFollows';

interface Props {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	descriptionRT: Richtext | null;
	moderationOpts: ModerationOptions;
	isPlaceholderProfile: boolean;
}

function ProfileHeaderBody() {
	const {
		meta: { isMe, isPlaceholderProfile, live, moderationOpts, relationship },
		state: { profile },
	} = useProfileHeader();

	const isBlockedUser =
		relationship === 'blocked-by' || relationship === 'blocking' || relationship === 'blocking-by-list';

	return (
		<div className={css.body}>
			<div className={css.buttonRow}>
				<ProfileHeaderActions />
			</div>

			<div className={clsx(css.nameBlock, live.isActive ? css.nameBlockLive : css.nameBlockDefault)}>
				{/* plain block: the name renders as inline text so a trailing badge flows onto its last line */}
				<div>
					<ProfileHeaderDisplayName tight />
					<ProfileBadges className={css.badges} interactive profile={profile} size="lg" />
				</div>
				<ProfileHeaderHandle profile={profile} />
			</div>

			{!isPlaceholderProfile && !isBlockedUser && (
				<div className={css.section}>
					<ProfileHeaderMetrics />

					<ProfileHeaderBio selectable />

					{profile.associated?.labeler && <LabelerButton did={profile.did} />}

					{profile.associated?.germ && <GermButton germ={profile.associated.germ} profile={profile} />}

					{!isMe && shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
						<div className={css.knownRow}>
							<KnownFollowers moderationOpts={moderationOpts} profile={profile} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/** Profile header for an account; labeler accounts additionally get a link to the labels they publish. */
export function ProfileHeader({
	descriptionRT,
	isPlaceholderProfile,
	moderationOpts,
	profile,
}: Props): React.ReactNode {
	const [showSuggestedFollows, setShowSuggestedFollows] = useState(false);
	const [hasSeenAllSuggestedFollows, setHasSeenAllSuggestedFollows] = useState(false);

	return (
		<ProfileHeaderProvider
			descriptionRT={descriptionRT}
			isPlaceholderProfile={isPlaceholderProfile}
			moderationOpts={moderationOpts}
			onFollowChange={setShowSuggestedFollows}
			profile={profile}
		>
			<ProfileHeaderShell>
				<ProfileHeaderBody />
			</ProfileHeaderShell>
			<ProfileHeaderSuggestedFollows
				actorDid={profile.did}
				isExpanded={!hasSeenAllSuggestedFollows && showSuggestedFollows}
				onRequestHide={() => {
					setHasSeenAllSuggestedFollows(true);
					setShowSuggestedFollows(false);
				}}
			/>
		</ProfileHeaderProvider>
	);
}
