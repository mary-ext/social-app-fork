import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useMyBlockedAccountsQuery } from '#/state/queries/my-blocked-accounts';

import { logger } from '#/logger';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';

import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import * as styles from './ModerationBlockedAccounts.css';

export function ModerationBlockedAccounts() {
	useTitle(m['common.block.accountsTitle']());

	const { data, isFetching, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useMyBlockedAccountsQuery();
	const isEmpty = !isFetching && !data?.pages[0]?.blocks.length;
	const profiles = data?.pages ? data.pages.flatMap((page) => page.blocks) : [];

	const onEndReached = async () => {
		if (isFetching || !hasNextPage || isError) {
			return;
		}

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more of my blocked accounts', { message: err });
		}
	};

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
						<ErrorScreen title="Oops!" message={cleanError(error)} onPressTryAgain={() => void refetch()} />
					) : (
						<Empty />
					)}
				</div>
			) : (
				<List
					data={profiles}
					keyExtractor={(item: ActorDefs.ProfileView) => item.did}
					onEndReached={() => void onEndReached()}
					renderItem={({ item, index }) => <BlockedRow index={index} profile={item} />}
					ListHeaderComponent={<Info />}
					ListFooterComponent={
						<ListFooter
							isFetchingNextPage={isFetchingNextPage}
							hasNextPage={hasNextPage}
							error={cleanError(error)}
							onRetry={fetchNextPage}
						/>
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
