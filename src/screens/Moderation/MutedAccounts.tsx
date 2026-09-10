import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useMyMutedAccountsQuery } from '#/state/queries/my-muted-accounts';
import { useTitle } from '#/state/use-title';

import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import * as Menu from '#/components/Menu';
import { UnmuteAllPrompt } from '#/components/moderation/unmute-all-prompt';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as profileCardCss from '#/components/web/ProfileCard.css';

import DotsHorizontal from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import Unmute from '#/icons/central/VolumeFull_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './MutedAccounts.css';

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

export function ModerationMutedAccounts() {
	useTitle(m['common.mute.accountsTitle']());

	const { data, isPending, isError, error, refetch, fetchNextPage, isFetchingNextPage } =
		useMyMutedAccountsQuery();
	const profiles = data?.pages ? data.pages.flatMap((page) => page.mutes) : [];
	const isEmpty = !isPending && profiles.length === 0;

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.mute.accountsTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				{!isEmpty && (
					<Layout.Header.EndSlot>
						<OverflowMenu />
					</Layout.Header.EndSlot>
				)}
			</Layout.Header.Outer>
			{isEmpty ? (
				<div>
					<Info />
					{isError ? <ErrorState onRetry={() => void refetch()} /> : <Empty />}
				</div>
			) : (
				<List
					data={profiles}
					estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
					keyExtractor={(item) => item.did}
					onEndReached={() => {
						if (isError) {
							return;
						}
						void fetchNextPage();
					}}
					renderItem={({ item, index }) => <MutedRow index={index} profile={item} />}
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

function OverflowMenu() {
	const clearHandle = Prompt.usePromptHandle();

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							color="secondary"
							label={m['common.a11y.moreOptions']()}
							shape="round"
							size="small"
							variant="ghost"
						>
							<ButtonIcon icon={DotsHorizontal} size="lg" />
						</Button>
					}
				/>
				<Menu.Popup align="end" label={m['common.a11y.moreOptions']()}>
					<Menu.Item
						destructive
						label={m['screens.moderation.mute.unmuteAll.action']()}
						onClick={() => clearHandle.open(null)}
					>
						<Menu.ItemText>{m['screens.moderation.mute.unmuteAll.action']()}</Menu.ItemText>
						<Menu.ItemIcon icon={Unmute} position="right" />
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>

			<UnmuteAllPrompt handle={clearHandle} />
		</>
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
