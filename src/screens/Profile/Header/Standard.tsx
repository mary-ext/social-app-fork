import { useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { clsx } from 'clsx';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { ProfileBadges } from '#/components/ProfileBadges';
import { KnownFollowers, shouldShowKnownFollowers } from '#/components/web/KnownFollowers';

import { GermButton } from '../components/GermButton';
import { StandardActions } from './Actions';
import { ProfileHeaderBio } from './Bio';
import { ProfileHeaderProvider, useProfileHeader } from './Context';
import { ProfileHeaderDisplayName } from './DisplayName';
import { ProfileHeaderHandle } from './Handle';
import { ProfileHeaderMetrics } from './Metrics';
import { ProfileHeaderShell } from './Shell';
import * as css from './Standard.css';
import { ProfileHeaderSuggestedFollows } from './SuggestedFollows';

interface Props {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	descriptionRT: Richtext | null;
	moderationOpts: ModerationOptions;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
}

function StandardBody() {
	const {
		meta: { isMe, isPlaceholderProfile, live, moderationOpts, relationship },
		state: { profile },
	} = useProfileHeader();

	const isBlockedUser =
		relationship === 'blocked-by' || relationship === 'blocking' || relationship === 'blocking-by-list';

	return (
		<div className={css.body}>
			<div className={css.buttonRow}>
				<StandardActions />
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

					{profile.associated?.germ && <GermButton germ={profile.associated.germ} profile={profile} />}

					{!isMe && shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
						<div className={css.knownRow}>
							<KnownFollowers moderationOpts={moderationOpts} profile={profile} />
						</div>
					)}
				</div>
			)}

			<DebugFieldDisplay subject={profile} />
		</div>
	);
}

/** Profile header for a regular (non-labeler) account. */
export function StandardProfileHeader({
	descriptionRT,
	hideBackButton = false,
	isPlaceholderProfile,
	moderationOpts,
	profile,
}: Props): React.ReactNode {
	const [showSuggestedFollows, setShowSuggestedFollows] = useState(false);
	const [hasSeenAllSuggestedFollows, setHasSeenAllSuggestedFollows] = useState(false);

	return (
		<ProfileHeaderProvider
			descriptionRT={descriptionRT}
			hideBackButton={hideBackButton}
			isPlaceholderProfile={isPlaceholderProfile}
			moderationOpts={moderationOpts}
			onFollowChange={setShowSuggestedFollows}
			profile={profile}
		>
			<ProfileHeaderShell>
				<StandardBody />
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
