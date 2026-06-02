import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { usePalette } from '#/lib/hooks/usePalette';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { s } from '#/lib/styles';

import { useModalControls } from '#/state/modals';
import {
	type ListWithMembership,
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
	useListsWithMembershipQuery,
} from '#/state/queries/list-memberships';
import { useSession } from '#/state/session';

import { IS_WEB_MOBILE } from '#/env';

import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
import * as Toast from '../util/Toast';
import { UserAvatar } from '../util/UserAvatar';

export function Component({
	profile,
	onAdd,
	onRemove,
}: {
	profile: AnyProfileView;
	onAdd?: (listUri: string) => void;
	onRemove?: (listUri: string) => void;
}) {
	const { closeModal } = useModalControls();
	const pal = usePalette('default');
	const { height: screenHeight } = useWindowDimensions();
	const { t: l } = useLingui();
	const displayName = profile.displayName || profile.handle;
	const { data: lists, isLoading } = useListsWithMembershipQuery({ actor: profile.did });

	const onPressDone = useCallback(() => {
		closeModal();
	}, [closeModal]);

	const renderItem = useCallback(
		({ item, index }: { item: ListWithMembership; index: number }) => (
			<ListItem index={index} item={item} profile={profile} onAdd={onAdd} onRemove={onRemove} />
		),
		[profile, onAdd, onRemove],
	);

	const listHeight = IS_WEB_MOBILE ? screenHeight / 2 : screenHeight / 1.5;

	const headerStyles = [
		{
			textAlign: 'center',
			fontWeight: '600',
			fontSize: 20,
			marginBottom: 12,
			paddingHorizontal: 12,
		} as const,
		pal.text,
	];

	return (
		<View testID="userAddRemoveListsModal" style={s.hContentRegion}>
			<Text style={headerStyles} numberOfLines={1}>
				<Trans>
					Update{' '}
					<Text style={headerStyles} numberOfLines={1}>
						{displayName}
					</Text>{' '}
					in Lists
				</Trans>
			</Text>
			<View style={[pal.border, { height: listHeight }]}>
				{isLoading ? (
					<View style={{ padding: 20 }}>
						<ActivityIndicator />
					</View>
				) : (
					<FlatList
						testID="userAddRemoveListsModal-flatlist"
						data={lists}
						keyExtractor={(item) => item.list.uri}
						renderItem={renderItem}
						contentContainerStyle={[s.contentContainer]}
						removeClippedSubviews={true}
					/>
				)}
			</View>
			<View style={[styles.btns, pal.border]}>
				<Button
					testID="doneBtn"
					type="default"
					onPress={onPressDone}
					style={styles.footerBtn}
					accessibilityLabel={l({ message: `Done`, context: 'action' })}
					accessibilityHint=""
					onAccessibilityEscape={onPressDone}
					label={l({ message: `Done`, context: 'action' })}
				/>
			</View>
		</View>
	);
}

function ListItem({
	index,
	item,
	profile,
	onAdd,
	onRemove,
}: {
	index: number;
	item: ListWithMembership;
	profile: AnyProfileView;
	onAdd?: (listUri: string) => void;
	onRemove?: (listUri: string) => void;
}) {
	const pal = usePalette('default');
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const [isProcessing, setIsProcessing] = useState(false);
	const { list } = item;
	const membershipUri = item.listItem?.uri;
	const listMembershipAddMutation = useListMembershipAddMutation({ subject: profile });
	const listMembershipRemoveMutation = useListMembershipRemoveMutation();

	const onToggleMembership = useCallback(async () => {
		setIsProcessing(true);
		try {
			if (!membershipUri) {
				await listMembershipAddMutation.mutateAsync({
					listUri: list.uri,
					actorDid: profile.did,
				});
				Toast.show(l`Added to list`);
				onAdd?.(list.uri);
			} else {
				await listMembershipRemoveMutation.mutateAsync({
					listUri: list.uri,
					actorDid: profile.did,
					membershipUri,
				});
				Toast.show(l`Removed from list`);
				onRemove?.(list.uri);
			}
		} catch (e) {
			Toast.show(cleanError(e), 'xmark');
		} finally {
			setIsProcessing(false);
		}
	}, [
		l,
		list.uri,
		profile.did,
		membershipUri,
		onAdd,
		onRemove,
		listMembershipAddMutation,
		listMembershipRemoveMutation,
	]);

	return (
		<View
			testID={`toggleBtn-${list.name}`}
			style={[styles.listItem, pal.border, index !== 0 && { borderTopWidth: StyleSheet.hairlineWidth }]}
		>
			<View style={styles.listItemAvi}>
				<UserAvatar size={40} avatar={list.avatar} type="list" />
			</View>
			<View style={styles.listItemContent}>
				<Text type="lg" style={[{ fontWeight: '600' }, pal.text]} numberOfLines={1} lineHeight={1.2}>
					{sanitizeDisplayName(list.name)}
				</Text>
				<Text type="md" style={[pal.textLight]} numberOfLines={1}>
					{list.purpose === 'app.bsky.graph.defs#curatelist' &&
						(list.creator.did === currentAccount?.did ? (
							<Trans>User list by you</Trans>
						) : (
							<Trans>User list by {sanitizeHandle(list.creator.handle, '@')}</Trans>
						))}
					{list.purpose === 'app.bsky.graph.defs#modlist' &&
						(list.creator.did === currentAccount?.did ? (
							<Trans>Moderation list by you</Trans>
						) : (
							<Trans>Moderation list by {sanitizeHandle(list.creator.handle, '@')}</Trans>
						))}
				</Text>
			</View>
			<View>
				{isProcessing ? (
					<ActivityIndicator />
				) : (
					<Button
						testID={`user-${profile.handle}-addBtn`}
						type="default"
						label={!membershipUri ? l`Add` : l`Remove`}
						onPress={onToggleMembership}
					/>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	btns: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		paddingTop: 10,
		paddingBottom: 0,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	footerBtn: {
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	listItemAvi: {
		width: 54,
		paddingLeft: 4,
		paddingTop: 8,
		paddingBottom: 10,
	},
	listItemContent: {
		flex: 1,
		paddingRight: 10,
		paddingTop: 10,
		paddingBottom: 10,
	},
});
