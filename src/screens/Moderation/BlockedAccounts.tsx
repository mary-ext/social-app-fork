import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useMyBlockedAccountsQuery } from '#/state/queries/my-blocked-accounts';
import { useTitle } from '#/state/use-title';

import { List } from '#/components/List/List';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import * as styles from './BlockedAccounts.css';

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

export function ModerationBlockedAccounts() {
	useTitle(m['common.block.accountsTitle']());

	const { data, isPending, isError, error, refetch, fetchNextPage, isFetchingNextPage } =
		useMyBlockedAccountsQuery();
	const profiles = data?.pages ? data.pages.flatMap((page) => page.blocks) : [];
	const isEmpty = !isPending && profiles.length === 0;

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.block.accountsTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			{isEmpty ? (
				<div>
					<Info />
					{isError ? (
						<ListError hideBackButton message={cleanError(error)} onRetry={() => void refetch()} />
					) : (
						<Empty />
					)}
				</div>
			) : (
				<List
					data={profiles}
					estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
					keyExtractor={(item: ActorDefs.ProfileView) => item.did}
					onEndReached={() => void fetchNextPage()}
					renderItem={({ item, index }) => <BlockedRow index={index} profile={item} />}
					ListHeaderComponent={<Info />}
					ListFooterComponent={
						<ListTail.Frame>
							{isFetchingNextPage ? (
								<ListTail.Pending />
							) : isError ? (
								<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
							) : null}
						</ListTail.Frame>
					}
				/>
			)}
		</Layout.Screen>
	);
}

function BlockedRow({ index, profile }: { index: number; profile: ActorDefs.ProfileView }) {
	const moderationOpts = useModerationOpts();
	if (!moderationOpts) {
		return null;
	}
	return <ProfileCard.Default moderationOpts={moderationOpts} profile={profile} topBorder={index !== 0} />;
}

function Empty() {
	return (
		<div className={styles.emptyContainer}>
			<div className={styles.emptyBox}>
				<Text align="center" color="textContrastHigh" size="sm">
					{m['common.block.empty']()}
				</Text>
			</div>
		</div>
	);
}

function Info() {
	return (
		<div className={styles.info}>
			<Text align="center" color="textContrastHigh" size="md_sub">
				{m['screens.moderation.block.hint']()}
			</Text>
		</div>
	);
}
