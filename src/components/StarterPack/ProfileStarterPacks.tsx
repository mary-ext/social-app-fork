import type { AnyStarterPackView } from '@atcute/bluesky';

import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useActorStarterPacksQuery } from '#/state/queries/actor-starter-packs';

import { logger } from '#/logger';

import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { PlusSmall_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import {
	Default as StarterPackCard,
	LoadingPlaceholder as StarterPackLoadingPlaceholder,
} from '#/components/StarterPack/StarterPackCard';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './ProfileStarterPacks.css';

// only governs rows that have never been on screen; the browser reuses the real size once rendered.
const STARTER_PACK_ITEM_HEIGHT_ESTIMATE = 120;

const LOADING = { _reactKey: '__loading__' } as const;
const EMPTY = { _reactKey: '__empty__' } as const;
const ERROR_ITEM = { _reactKey: '__error__' } as const;
const LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' } as const;

type StarterPackItem =
	| AnyStarterPackView
	| typeof EMPTY
	| typeof ERROR_ITEM
	| typeof LOADING
	| typeof LOAD_MORE_ERROR_ITEM;
type StarterPackSentinel = Exclude<StarterPackItem, AnyStarterPackView>;

const isStarterPackSentinel = (item: StarterPackItem): item is StarterPackSentinel => {
	return '_reactKey' in item;
};

interface ProfileStarterPacksProps {
	did: string;
	enabled?: boolean;
	isMe: boolean;
	/** Known starter-pack count, used to size the loading skeleton; falls back to a small default. */
	starterPackCount?: number;
	emptyStateMessage?: string;
	emptyStateButton?: EmptyStateButtonProps;
	emptyStateIcon?: EmptyStateIcon | React.ReactElement;
}

export function ProfileStarterPacks({
	did,
	enabled,
	isMe,
	starterPackCount,
	emptyStateMessage,
	emptyStateButton,
	emptyStateIcon,
}: ProfileStarterPacksProps): React.ReactNode {
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		useActorStarterPacksQuery({ did, enabled });
	const isEmpty = !isPending && !data?.pages[0]?.starterPacks.length;
	const starterPacks = data?.pages.flatMap((page) => page.starterPacks);
	const hasStarterPacks = !!starterPacks?.length;

	let items: StarterPackItem[] = [];
	if (isError && isEmpty) {
		items = items.concat([ERROR_ITEM]);
	}
	if (isPending) {
		items = items.concat([LOADING]);
	} else if (isEmpty) {
		items = items.concat([EMPTY]);
	} else if (data?.pages) {
		for (const page of data?.pages) {
			items = items.concat(page.starterPacks);
		}
	} else if (isError && !isEmpty) {
		items = items.concat([LOAD_MORE_ERROR_ITEM]);
	}

	// events
	// =

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more starter packs', { message: err });
		}
	};

	const onPressRetryLoadMore = () => {
		void fetchNextPage();
	};

	// rendering
	// =

	const renderItem = ({ index, item }: ListRenderItemInfo<StarterPackItem>) => {
		if (isStarterPackSentinel(item)) {
			if (item === ERROR_ITEM) {
				return <ErrorMessage message={cleanError(error)} onPressTryAgain={() => void refetch()} />;
			}
			if (item === LOAD_MORE_ERROR_ITEM) {
				return (
					<LoadMoreRetryBtn label={m['components.starterPack.list.error']()} onPress={onPressRetryLoadMore} />
				);
			}
			if (item === LOADING) {
				return <StarterPackLoadingPlaceholder count={starterPackCount} />;
			}
			return (
				<EmptyState
					icon={emptyStateIcon}
					message={emptyStateMessage ?? m['components.starterPack.list.empty']()}
					button={emptyStateButton}
				/>
			);
		}
		// the first starter pack card sits flush under the sticky tab bar; drop its top separator so the two
		// don't draw a doubled line.
		return <StarterPackCard starterPack={item} topBorder={index !== 0} />;
	};

	return (
		<List
			data={items}
			estimateHeight={STARTER_PACK_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListFooterComponent={
				isEmpty ? undefined : hasNextPage || isFetchingNextPage ? (
					<ListFooter
						hasNextPage={hasNextPage}
						isFetchingNextPage={isFetchingNextPage}
						onRetry={fetchNextPage}
						error={cleanError(error)}
						height={180}
					/>
				) : isMe && hasStarterPacks ? (
					<CreateAnother />
				) : undefined
			}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={2}
		/>
	);
}

function keyExtractor(item: StarterPackItem) {
	return isStarterPackSentinel(item) ? item._reactKey : item.uri;
}

/** A footer row offering the profile owner a shortcut back to the starter-pack wizard. */
function CreateAnother() {
	const navigation = useNavigation<NavigationProp>();

	return (
		<div className={css.createAnother}>
			<Button
				color="secondary"
				label={m['common.starterPack.action.create']()}
				onClick={() => navigation.navigate('StarterPackWizard', {})}
				size="small"
				variant="solid"
			>
				<ButtonText>{m['components.starterPack.create.another']()}</ButtonText>
				<ButtonIcon icon={PlusIcon} />
			</Button>
		</div>
	);
}
