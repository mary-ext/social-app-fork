import { useState } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useMyBlockedAccountsQuery } from '#/state/queries/my-blocked-accounts';

import { logger } from '#/logger';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationBlockedAccounts'>;
export function ModerationBlockedAccounts({}: Props) {
	const t = useTheme();
	const moderationOpts = useModerationOpts();

	const [isPTRing, setIsPTRing] = useState(false);
	const { data, isFetching, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useMyBlockedAccountsQuery();
	const isEmpty = !isFetching && !data?.pages[0]?.blocks.length;
	const profiles = data?.pages ? data.pages.flatMap((page) => page.blocks) : [];

	const onRefresh = async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh my muted accounts', { message: err });
		}
		setIsPTRing(false);
	};

	const onEndReached = async () => {
		if (isFetching || !hasNextPage || isError) return;

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more of my muted accounts', { message: err });
		}
	};

	const renderItem = ({ item, index }: { item: ActorDefs.ProfileView; index: number }) => {
		if (!moderationOpts) return null;
		return (
			<View style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]} key={item.did}>
				<ProfileCard.Default
					testID={`blockedAccount-${index}`}
					profile={item}
					moderationOpts={moderationOpts}
				/>
			</View>
		);
	};

	return (
		<Layout.Screen testID="blockedAccountsScreen">
			<Layout.Center>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['common.block.accountsTitle']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
					<Layout.Header.Slot />
				</Layout.Header.Outer>
				{isEmpty ? (
					<View>
						<Info style={[a.border_b]} />
						{isError ? (
							<ErrorScreen title="Oops!" message={cleanError(error)} onPressTryAgain={() => void refetch()} />
						) : (
							<Empty />
						)}
					</View>
				) : (
					<List
						data={profiles}
						keyExtractor={(item: ActorDefs.ProfileView) => item.did}
						refreshing={isPTRing}
						onRefresh={() => void onRefresh()}
						onEndReached={() => void onEndReached()}
						renderItem={renderItem}
						initialNumToRender={15}
						// FIXME(dan)

						ListHeaderComponent={Info}
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
			</Layout.Center>
		</Layout.Screen>
	);
}

function Empty() {
	const t = useTheme();
	return (
		<View style={[a.pt_2xl, a.px_xl, a.align_center]}>
			<View
				style={[
					a.py_md,
					a.px_lg,
					a.rounded_sm,
					t.atoms.bg_contrast_25,
					a.border,
					t.atoms.border_contrast_low,
					{ maxWidth: 400 },
				]}
			>
				<Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_high]}>
					{m['common.block.empty']()}
				</Text>
			</View>
		</View>
	);
}

function Info({ style }: { style?: StyleProp<ViewStyle> }) {
	const t = useTheme();
	return (
		<View
			style={[
				a.w_full,
				t.atoms.bg_contrast_25,
				a.py_md,
				a.px_xl,
				a.border_t,
				{ marginTop: a.border.borderWidth * -1 },
				t.atoms.border_contrast_low,
				style,
			]}
		>
			<Text style={[a.text_center, a.text_sm, t.atoms.text_contrast_high]}>
				{m['screens.moderation.block.hint']()}
			</Text>
		</View>
	);
}
