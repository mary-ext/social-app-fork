import type { ReactNode } from 'react';

import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';

import { useActorStarterPacksQuery } from '#/state/queries/actor-starter-packs';

import { List } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import {
	Default as StarterPackCard,
	LoadingPlaceholder as StarterPackLoadingPlaceholder,
} from '#/components/StarterPack/StarterPackCard';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import CircleAndSquareIcon from '#/icons/original/CircleAndSquare.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import * as css from './ProfileStarterPacks.css';

const STARTER_PACK_ITEM_HEIGHT_ESTIMATE = 120;

interface ProfileStarterPacksProps {
	did: Did;
	isMe: boolean;
	starterPackCount?: number;
}

export function ProfileStarterPacks({ did, isMe, starterPackCount }: ProfileStarterPacksProps): ReactNode {
	const router = useRouter();
	const { data, error, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isPending, refetch } =
		useActorStarterPacksQuery({ did });

	const starterPacks = data?.pages.flatMap((page) => page.starterPacks) ?? [];

	if (starterPacks.length < 1) {
		if (isError) {
			return <ListError hideBackButton message={cleanError(error)} onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <StarterPackLoadingPlaceholder count={starterPackCount} />;
		}

		return (
			<ListEmpty
				icon={CircleAndSquareIcon}
				message={isMe ? m['components.starterPack.list.empty']() : m['common.starterPack.empty']()}
				button={
					isMe
						? {
								label: m['common.starterPack.action.create'](),
								text: m['common.starterPack.action.create'](),
								onPress: () => router.navigate({ to: { name: 'StarterPackWizard' } }),
								size: 'small',
								color: 'primary',
							}
						: undefined
				}
			/>
		);
	}

	return (
		<List
			data={starterPacks}
			estimateHeight={STARTER_PACK_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			renderItem={({ index, item }) => <StarterPackCard starterPack={item} topBorder={index !== 0} />}
			ListFooterComponent={
				isMe && !hasNextPage && !isFetchingNextPage && !isError ? (
					<CreateAnother />
				) : (
					<ListTail.Frame>
						{isFetchingNextPage ? (
							<ListTail.Pending />
						) : isError ? (
							<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
						) : null}
					</ListTail.Frame>
				)
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

function CreateAnother() {
	const router = useRouter();

	return (
		<div className={css.createAnother}>
			<Button
				color="secondary"
				label={m['common.starterPack.action.create']()}
				onClick={() => router.navigate({ to: { name: 'StarterPackWizard' } })}
				size="small"
				variant="solid"
			>
				<ButtonText>{m['components.starterPack.create.another']()}</ButtonText>
				<ButtonIcon icon={PlusIcon} />
			</Button>
		</div>
	);
}
