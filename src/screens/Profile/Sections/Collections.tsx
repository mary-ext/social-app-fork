import type { ReactNode } from 'react';

import type { Did } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/errors';

import { useActorStarterPacksQuery } from '#/state/queries/actor-starter-packs';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileFeedgensQuery } from '#/state/queries/profile-feedgens';
import { useProfileListsQuery } from '#/state/queries/profile-lists';

import { formatCount } from '#/locale/intl/number';

import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/components/EmptyState';
import { ErrorMessage } from '#/components/ErrorMessage';
import * as FeedCard from '#/components/FeedCard';
import * as ListCard from '#/components/ListCard';
import {
	Default as StarterPackCard,
	LoadingPlaceholder as StarterPackLoadingPlaceholder,
} from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import FeedIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke2.svg';
import StarterPackIcon from '#/icons/original/CircleAndSquare.svg';
import { m } from '#/paraglide/messages';
import { type RouteTarget, useParams, useRouter } from '#/router';

import * as css from './Collections.css';

const PREVIEW_LIMIT = 3;

interface ProfileCollectionsProps {
	did: Did;
	feedCount: number;
	isMe: boolean;
	listCount: number;
	starterPackCount: number;
}

/**
 * @param props profile identity and collection counts
 * @returns the profile's collection previews
 */
export function ProfileCollectionsSection({
	did,
	feedCount,
	isMe,
	listCount,
	starterPackCount,
}: ProfileCollectionsProps): ReactNode {
	const router = useRouter();
	const [{ actor }] = useParams('Profile');

	const { data: preferences } = usePreferencesQuery();
	const feeds = useProfileFeedgensQuery(did);
	const starterPacks = useActorStarterPacksQuery({ did });
	const lists = useProfileListsQuery(did);

	const feedItems = feeds.data?.pages.flatMap((page) => page.feeds) ?? [];
	const starterPackItems = starterPacks.data?.pages.flatMap((page) => page.starterPacks) ?? [];
	const listItems = lists.data?.pages.flatMap((page) => page.lists) ?? [];

	return (
		<>
			<CollectionGroup
				count={feedCount}
				emptyButton={
					isMe
						? {
								color: 'secondary',
								label: m['view.feeds.discover.browse'](),
								onPress: () => router.navigate({ to: { name: 'Feeds' } }),
								text: m['view.feeds.discover.browse'](),
							}
						: undefined
				}
				emptyMessage={isMe ? m['view.feeds.saved.empty.message']() : m['view.feeds.saved.empty.title']()}
				error={feeds.isError ? cleanError(feeds.error) : undefined}
				hasMore={feedItems.length > PREVIEW_LIMIT || feeds.hasNextPage}
				icon={FeedIcon}
				isMe={isMe}
				isPending={feeds.isPending}
				items={feedItems}
				onRetry={() => void feeds.refetch()}
				placeholder={<FeedCard.LoadingPlaceholder count={Math.min(feedCount, PREVIEW_LIMIT)} />}
				renderItem={(item, index) =>
					preferences ? <FeedCard.Default key={item.uri} view={item} topBorder={index !== 0} /> : null
				}
				seeAllTarget={{ name: 'ProfileFeeds', actor }}
				title={m['common.nav.feeds']()}
			/>

			<CollectionGroup
				count={starterPackCount}
				emptyButton={
					isMe
						? {
								color: 'primary',
								label: m['common.starterPack.action.create'](),
								onPress: () => router.navigate({ to: { name: 'StarterPackWizard' } }),
								text: m['common.starterPack.action.create'](),
							}
						: undefined
				}
				emptyMessage={isMe ? m['components.starterPack.list.empty']() : m['common.starterPack.empty']()}
				error={starterPacks.isError ? cleanError(starterPacks.error) : undefined}
				hasMore={starterPackItems.length > PREVIEW_LIMIT || starterPacks.hasNextPage}
				icon={StarterPackIcon}
				isMe={isMe}
				isPending={starterPacks.isPending}
				items={starterPackItems}
				onRetry={() => void starterPacks.refetch()}
				placeholder={<StarterPackLoadingPlaceholder count={Math.min(starterPackCount, PREVIEW_LIMIT)} />}
				renderItem={(item, index) => (
					<StarterPackCard key={item.uri} starterPack={item} topBorder={index !== 0} />
				)}
				seeAllTarget={{ name: 'ProfileStarterPacks', actor }}
				title={m['common.starterPack.sectionTitle']()}
			/>

			<CollectionGroup
				count={listCount}
				emptyButton={
					isMe
						? {
								color: 'primary',
								label: m['common.list.create'](),
								onPress: () => router.navigate({ to: { name: 'Lists' } }),
								text: m['common.list.create'](),
							}
						: undefined
				}
				emptyMessage={isMe ? m['common.list.empty']() : m['common.list.emptyUser']()}
				error={lists.isError ? cleanError(lists.error) : undefined}
				hasMore={listItems.length > PREVIEW_LIMIT || lists.hasNextPage}
				icon={ListIcon}
				isMe={isMe}
				isPending={lists.isPending}
				items={listItems}
				onRetry={() => void lists.refetch()}
				placeholder={<ListCard.LoadingPlaceholder count={Math.min(listCount, PREVIEW_LIMIT)} />}
				renderItem={(item, index) =>
					preferences ? <ListCard.Default key={item.uri} view={item} topBorder={index !== 0} /> : null
				}
				seeAllTarget={{ name: 'ProfileLists', actor }}
				title={m['common.list.label']()}
			/>
		</>
	);
}

interface CollectionGroupProps<Item> {
	count: number;
	emptyButton: EmptyStateButtonProps | undefined;
	emptyMessage: string;
	error: string | undefined;
	hasMore: boolean;
	icon: EmptyStateIcon;
	isMe: boolean;
	isPending: boolean;
	items: Item[];
	onRetry: () => void;
	placeholder: ReactNode;
	renderItem: (item: Item, index: number) => ReactNode;
	seeAllTarget: RouteTarget;
	title: string;
}

function CollectionGroup<Item>({
	count,
	emptyButton,
	emptyMessage,
	error,
	hasMore,
	icon: Icon,
	isMe,
	isPending,
	items,
	onRetry,
	placeholder,
	renderItem,
	seeAllTarget,
	title,
}: CollectionGroupProps<Item>): ReactNode {
	const isCountEmpty = count === 0 && items.length === 0 && !error;

	if (!isMe && isCountEmpty) {
		return null;
	}

	const isEmpty = !isPending && items.length === 0;

	if (isEmpty && !isMe && !error) {
		return null;
	}

	let body: ReactNode;
	if (isCountEmpty) {
		body = (
			<EmptyState button={emptyButton} icon={Icon} message={emptyMessage} messageColor="textContrastMedium" />
		);
	} else if (error && items.length === 0) {
		body = <ErrorMessage message={error} onPressTryAgain={onRetry} />;
	} else if (isPending) {
		body = placeholder;
	} else if (isEmpty) {
		body = (
			<EmptyState button={emptyButton} icon={Icon} message={emptyMessage} messageColor="textContrastMedium" />
		);
	} else {
		body = items.slice(0, PREVIEW_LIMIT).map(renderItem);
	}

	return (
		<section className={css.group}>
			<div className={css.header}>
				<div className={css.headerIcon}>
					<Icon className={css.icon} />
				</div>
				<Text size="lg" weight="bold">
					{title}
				</Text>
				{count > 0 && (
					<Text className={css.count} color="textContrastMedium" size="sm" weight="medium">
						{formatCount(count)}
					</Text>
				)}
				{hasMore && (
					<LinkButton
						className={css.seeAll}
						color="secondary"
						label={m['screens.profile.collections.action.seeAll']()}
						size="small"
						to={seeAllTarget}
						variant="ghost"
					>
						<ButtonText>{m['screens.profile.collections.action.seeAll']()}</ButtonText>
						<ButtonIcon icon={ChevronRightIcon} size="sm" />
					</LinkButton>
				)}
			</div>

			{body}
		</section>
	);
}
