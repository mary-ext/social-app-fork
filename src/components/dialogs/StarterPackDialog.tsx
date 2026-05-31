import { useCallback } from 'react';
import { View } from 'react-native';
import {
	type AnyProfileView,
	type AppBskyGraphGetStarterPacksWithMembership,
	type AppBskyGraphStarterpack,
} from '@atcute/bluesky';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { type NavigationProp } from '#/lib/routes/types';
import { isNetworkError } from '#/lib/strings/errors';

import { useActorStarterPacksWithMembershipsQuery } from '#/state/queries/actor-starter-packs';
import {
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { AvatarStack } from '#/components/AvatarStack';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { StarterPack } from '#/components/icons/StarterPack';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

type StarterPackWithMembership = AppBskyGraphGetStarterPacksWithMembership.StarterPackWithMembership;
type StarterPackDialogItem = StarterPackWithMembership | { type: 'starter_pack_dialog_loader' };

export type StarterPackDialogProps = {
	control: Dialog.DialogControlProps;
	targetDid: string;
	enabled?: boolean;
};

export function StarterPackDialog({ control, targetDid, enabled }: StarterPackDialogProps) {
	const navigation = useNavigation<NavigationProp>();

	const navToWizard = useCallback(() => {
		control.close();
		navigation.navigate('StarterPackWizard', {
			fromDialog: true,
			targetDid: targetDid,
			onSuccess: () => {
				setTimeout(() => {
					if (!control.isOpen) {
						control.open();
					}
				}, 0);
			},
		});
	}, [navigation, control, targetDid]);

	const wrappedNavToWizard = navToWizard;

	return (
		<Dialog.Outer control={control} nativeOptions={{ fullHeight: true }}>
			<Dialog.Handle />
			<StarterPackList onStartWizard={wrappedNavToWizard} targetDid={targetDid} enabled={enabled} />
		</Dialog.Outer>
	);
}

function Empty({ onStartWizard }: { onStartWizard: () => void }) {
	const { t: l } = useLingui();
	const t = useTheme();

	return (
		<View style={[a.gap_2xl, { paddingTop: 100 }]}>
			<View style={[a.gap_xs, a.align_center]}>
				<StarterPack width={48} fill={t.atoms.border_contrast_medium.borderColor} />
				<Text style={[a.text_center]}>
					<Trans>You have no starter packs.</Trans>
				</Text>
			</View>
			<View style={[a.align_center]}>
				<Button
					label={l`Create starter pack`}
					color="secondary_inverted"
					size="small"
					onPress={onStartWizard}
				>
					<ButtonText>
						<Trans comment="Text on button to create a new starter pack">Create</Trans>
					</ButtonText>
					<ButtonIcon icon={PlusIcon} />
				</Button>
			</View>
		</View>
	);
}

function StarterPackList({
	onStartWizard,
	targetDid,
	enabled,
}: {
	onStartWizard: () => void;
	targetDid: string;
	enabled?: boolean;
}) {
	const control = Dialog.useDialogContext();
	const { t: l } = useLingui();
	const { data: subject } = useProfileQuery({ did: targetDid });

	const { data, isError, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
		useActorStarterPacksWithMembershipsQuery({ did: targetDid, enabled });

	const membershipItems = data?.pages.flatMap((page) => page.starterPacksWithMembership) || [];

	const onEndReached = useCallback(async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			// Error handling is optional since this is just pagination
		}
	}, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);

	const renderItem = useCallback(
		({ item }: { item: StarterPackDialogItem }) => {
			if ('type' in item) {
				return (
					<View style={[a.align_center, a.py_2xl]}>
						<Loader size="xl" />
					</View>
				);
			}

			return <StarterPackItem starterPackWithMembership={item} targetDid={targetDid} subject={subject} />;
		},
		[targetDid, subject],
	);

	const onClose = useCallback(() => {
		control.close();
	}, [control]);

	const listHeader = (
		<>
			<View style={[a.justify_between, a.align_center, a.flex_row, a.pb_lg]}>
				<Text style={[a.text_lg, a.font_semi_bold]}>
					<Trans>Add to starter packs</Trans>
				</Text>
				<Button
					label={l`Close`}
					onPress={onClose}
					variant="ghost"
					color="secondary"
					size="small"
					shape="round"
					style={{ margin: -8 }}
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</View>
			{membershipItems.length > 0 && (
				<>
					<View style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}>
						<Text style={[a.text_md, a.font_semi_bold]}>
							<Trans>New starter pack</Trans>
						</Text>
						<Button
							label={l`Create starter pack`}
							color="secondary_inverted"
							size="small"
							onPress={onStartWizard}
						>
							<ButtonText>
								<Trans comment="Text on button to create a new starter pack">Create</Trans>
							</ButtonText>
							<ButtonIcon icon={PlusIcon} />
						</Button>
					</View>
					<Divider />
				</>
			)}
		</>
	);

	return (
		<Dialog.InnerFlatList
			data={
				isLoading
					? [{ type: 'starter_pack_dialog_loader' } as StarterPackDialogItem]
					: (membershipItems as StarterPackDialogItem[])
			}
			renderItem={renderItem}
			keyExtractor={(item) => ('type' in item ? item.type : item.starterPack.uri)}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.1}
			ListHeaderComponent={listHeader}
			ListEmptyComponent={<Empty onStartWizard={onStartWizard} />}
			style={[a.px_2xl, { minHeight: 500 }]}
		/>
	);
}

function StarterPackItem({
	starterPackWithMembership,
	targetDid,
	subject,
}: {
	starterPackWithMembership: StarterPackWithMembership;
	targetDid: string;
	subject?: AnyProfileView;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const isSelf = subject?.did === currentAccount?.did;

	const starterPack = starterPackWithMembership.starterPack;
	const isInPack = !!starterPackWithMembership.listItem;

	const { mutate: addMembership, isPending: isPendingAdd } = useListMembershipAddMutation({
		subject,
		onSuccess: () => {
			Toast.show(l`Added to starter pack`);
		},
		onError: (err) => {
			if (!isNetworkError(err)) {
				logger.error('Failed to add to starter pack', { safeMessage: err });
			}
			Toast.show(l`Failed to add to starter pack`, { type: 'error' });
		},
	});

	const { mutate: removeMembership, isPending: isPendingRemove } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(l`Removed from starter pack`);
		},
		onError: (err) => {
			if (!isNetworkError(err)) {
				logger.error('Failed to remove from starter pack', { safeMessage: err });
			}
			Toast.show(l`Failed to remove from starter pack`, { type: 'error' });
		},
	});

	const isPending = isPendingAdd || isPendingRemove;

	const handleToggleMembership = () => {
		if (!starterPack.list?.uri || isPending) return;

		const listUri = starterPack.list.uri;

		if (!isInPack) {
			addMembership({
				listUri: listUri,
				actorDid: targetDid,
			});
		} else {
			if (!starterPackWithMembership.listItem?.uri) {
				console.error('Cannot remove: missing membership URI');
				return;
			}
			removeMembership({
				listUri: listUri,
				actorDid: targetDid,
				membershipUri: starterPackWithMembership.listItem.uri,
			});
		}
	};

	const record = starterPack.record as AppBskyGraphStarterpack.Main;

	return (
		<View style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}>
			<View>
				<Text emoji style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
					{record.name}
				</Text>

				<View style={[a.flex_row, a.align_center, a.mt_xs]}>
					{starterPack.listItemsSample && starterPack.listItemsSample.length > 0 && (
						<>
							<AvatarStack
								size={24}
								profiles={
									starterPack.listItemsSample?.slice(0, 4).map((p) => p.subject as AnyProfileView) ?? []
								}
							/>

							{starterPack.list?.listItemCount && starterPack.list.listItemCount > 4 && (
								<Text style={[a.text_sm, t.atoms.text_contrast_medium, a.ml_xs]}>
									<Trans>
										<Plural value={starterPack.list.listItemCount - 4} other="+# more" />
									</Trans>
								</Text>
							)}
						</>
					)}
				</View>
			</View>
			<Button
				label={isInPack ? l`Remove` : l`Add`}
				color={isInPack ? 'secondary' : 'primary_subtle'}
				size="tiny"
				disabled={isPending || isSelf}
				onPress={handleToggleMembership}
			>
				{isPending && <ButtonIcon icon={Loader} />}
				<ButtonText>
					{isSelf ? <Trans>Owner</Trans> : isInPack ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
				</ButtonText>
			</Button>
		</View>
	);
}
