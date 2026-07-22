import { TIMELINE_SAVED_FEED } from '#/lib/constants';

import { useAddSavedFeedsMutation } from '#/state/queries/preferences';

import { Trans } from '#/locale/Trans';

import { Text } from '#/components/Text';
import { InlineButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './NoFollowingFeed.css';

export function NoFollowingFeed({ onAddFeed }: { onAddFeed?: () => void }) {
	const { mutateAsync: addSavedFeeds } = useAddSavedFeedsMutation();

	const addRecommendedFeeds = () => {
		void addSavedFeeds([
			{
				...TIMELINE_SAVED_FEED,
				pinned: true,
			},
		]);

		onAddFeed?.();
	};

	return (
		<div className={css.container}>
			<Text color="textContrastMedium" leading="snug">
				<Trans
					message={m['screens.feeds.missingFollowing']}
					markup={{
						t0: ({ children }) => (
							<InlineButton
								label={m['screens.feeds.action.addFollowing']()}
								leading="snug"
								onClick={addRecommendedFeeds}
							>
								{children}
							</InlineButton>
						),
					}}
				/>
			</Text>
		</div>
	);
}
