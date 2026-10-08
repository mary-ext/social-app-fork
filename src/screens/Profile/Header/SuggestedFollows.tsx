import type { Did } from '@atcute/lexicons';

import { useSuggestedFollowsByActorWithDismiss } from '#/state/queries/suggested-follows';

import { ProfileGrid } from '#/components/FeedInterstitials';
import * as Collapsible from '#/components/primitives/collapsible';

import * as styles from './SuggestedFollows.css';

export function ProfileHeaderSuggestedFollows({
	isExpanded,
	actorDid,
	onRequestHide,
}: {
	isExpanded: boolean;
	actorDid: Did;
	onRequestHide: () => void;
}) {
	const { profiles, onDismiss, isLoading, error } = useSuggestedFollowsByActorWithDismiss({ did: actorDid });

	return (
		<Collapsible.Standalone open={isExpanded} className={styles.panel}>
			<ProfileGrid
				isSuggestionsLoading={isLoading}
				profiles={profiles}
				totalProfileCount={profiles.length}
				error={error}
				viewContext="profileHeader"
				onDismiss={onDismiss}
				onRequestHide={onRequestHide}
			/>
		</Collapsible.Standalone>
	);
}
