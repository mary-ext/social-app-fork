import { useFeedSourceInfoQuery } from '#/state/queries/feed';

import * as FeedCard from '#/components/FeedCard';
import * as ListCard from '#/components/ListCard';

import { MissingFeed } from './MissingFeed';
import * as css from './SavedFeedCard.css';

const AVATAR_SIZE = 36;

/**
 * compact link card for a single saved feed or list, resolving the source from its AT-URI. renders a loading
 * placeholder while resolving and a fallback if the source can't be loaded.
 *
 * @param feedUri feed generator or list AT-URI.
 */
export function SavedFeedCard({ feedUri }: { feedUri: string }) {
	const { data: feed, error } = useFeedSourceInfoQuery({ uri: feedUri });

	if (feed?.type === 'feed' && feed.view) {
		const { view } = feed;
		return (
			<FeedCard.Link className={css.card} view={view}>
				<FeedCard.Header>
					<FeedCard.Avatar size={AVATAR_SIZE} src={view.avatar} />
					<FeedCard.TitleAndByline creator={view.creator} title={view.displayName} />
				</FeedCard.Header>
			</FeedCard.Link>
		);
	}

	if (feed?.type === 'list' && feed.view) {
		const { view } = feed;
		return (
			<ListCard.Link className={css.card} view={view}>
				<ListCard.Header>
					<ListCard.Avatar size={AVATAR_SIZE} src={view.avatar} />
					<ListCard.TitleAndByline creator={view.creator} purpose={view.purpose} title={view.name} />
				</ListCard.Header>
			</ListCard.Link>
		);
	}

	if (error) {
		return <MissingFeed error={error} uri={feedUri} />;
	}

	return <Placeholder />;
}

function Placeholder() {
	return (
		<div className={css.card}>
			<FeedCard.Header>
				<FeedCard.AvatarPlaceholder size={AVATAR_SIZE} />
				<FeedCard.TitleAndBylinePlaceholder creator />
			</FeedCard.Header>
		</div>
	);
}
