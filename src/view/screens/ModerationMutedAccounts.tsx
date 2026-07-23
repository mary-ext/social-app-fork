import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useMyMutedAccountsQuery } from '#/state/queries/my-muted-accounts';

import { logger } from '#/logger';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';

import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as profileCardCss from '#/components/web/ProfileCard.css';

import { m } from '#/paraglide/messages';

import * as styles from './ModerationMutedAccounts.css';

export function ModerationMutedAccounts() {
	useTitle(m['common.mute.accountsTitle']());

	const { data, isFetching, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useMyMutedAccountsQuery();
	const isEmpty = !isFetching && !data?.pages[0]?.mutes.length;
	const profiles = data?.pages ? data.pages.flatMap((page) => page.mutes) : [];

	const onEndReached = async () => {
		if (isFetching || !hasNextPage || isError) {
			return;
		}

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more of my muted accounts', { message: err });
		}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.mute.accountsTitle']()}</Layout.Header.TitleText>
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
					keyExtractor={(item) => item.did}
					onEndReached={() => void onEndReached()}
					renderItem={({ item, index }) => <MutedRow index={index} profile={item} />}
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

function MutedRow({ index, profile }: { index: number; profile: ActorDefs.ProfileView }) {
	const moderationOpts = useModerationOpts();
	if (!moderationOpts) {
		return null;
	}
	return (
		<ProfileCard.Link className={profileCardCss.defaultRow({ topBorder: index !== 0 })} profile={profile}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
					<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
				</ProfileCard.Header>
				<ProfileCard.Labels profile={profile} moderationOpts={moderationOpts} />
				<ProfileCard.Description profile={profile} />
			</ProfileCard.Outer>
		</ProfileCard.Link>
	);
}

function Empty() {
	return (
		<div className={styles.emptyContainer}>
			<div className={styles.emptyBox}>
				<Text align="center" color="textContrastHigh" size="sm">
					{m['common.mute.empty']()}
				</Text>
			</div>
		</div>
	);
}

function Info() {
	return (
		<div className={styles.info}>
			<Text align="center" color="textContrastHigh" size="md_sub">
				{m['screens.moderation.mute.hint']()}
			</Text>
		</div>
	);
}
