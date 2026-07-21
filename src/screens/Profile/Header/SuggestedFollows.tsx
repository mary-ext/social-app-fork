import type { Did } from '@atcute/lexicons';

import { Collapsible } from '@base-ui/react/collapsible';

import { useSuggestedFollowsByActorWithDismiss } from '#/state/queries/suggested-follows';

import { ProfileGrid } from '#/components/FeedInterstitials';

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

	// Base UI unmounts the panel while collapsed, so the grid's buttons leave the tab order entirely when hidden.
	return (
		<Collapsible.Root open={isExpanded}>
			<Collapsible.Panel className={styles.panel}>
				<ProfileGrid
					isSuggestionsLoading={isLoading}
					profiles={profiles}
					totalProfileCount={profiles.length}
					error={error}
					viewContext="profileHeader"
					onDismiss={onDismiss}
					onRequestHide={onRequestHide}
				/>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
