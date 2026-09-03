import type { ReactNode } from 'react';

import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';

import { useProfileFeedgensQuery } from '#/state/queries/profile-feedgens';
import { useSession } from '#/state/session';

import { BlankState } from '#/components/BlankState';
import { ErrorState } from '#/components/ErrorState';
import * as FeedCard from '#/components/FeedCard';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import { ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import HashtagWideIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke1.svg';
import { m } from '#/paraglide/messages';

const FEEDGEN_ITEM_HEIGHT_ESTIMATE = 120;

interface ProfileFeedgensProps {
	did: Did;
	feedCount?: number;
}

export function ProfileFeedgens({ did, feedCount }: ProfileFeedgensProps): ReactNode {
	const { currentAccount } = useSession();

	const { data, error, fetchNextPage, isError, isFetchingNextPage, isPending, refetch } =
		useProfileFeedgensQuery(did);

	const isSelf = currentAccount?.did === did;

	const feeds = data?.pages.flatMap((page) => page.feeds) ?? [];

	if (feeds.length < 1) {
		if (isError) {
			return <ErrorState onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <FeedCard.LoadingPlaceholder count={feedCount} />;
		}

		return (
			<BlankState
				actions={
					isSelf && (
						<LinkButton
							color="secondary"
							label={m['view.feeds.discover.browse']()}
							size="small"
							to={{ name: 'Feeds' }}
							variant="solid"
						>
							<ButtonText>{m['view.feeds.discover.browse']()}</ButtonText>
						</LinkButton>
					)
				}
				icon={HashtagWideIcon}
				message={isSelf ? m['view.feeds.saved.empty.message']() : m['view.feeds.saved.empty.title']()}
			/>
		);
	}

	return (
		<List
			data={feeds}
			estimateHeight={FEEDGEN_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			renderItem={({ index, item }) => <FeedCard.Default view={item} topBorder={index !== 0} />}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={2}
		/>
	);
}
