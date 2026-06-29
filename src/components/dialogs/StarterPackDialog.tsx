import type {
	AnyProfileView,
	AppBskyGraphGetStarterPacksWithMembership,
	AppBskyGraphStarterpack,
} from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { isNetworkError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorStarterPacksWithMembershipsQuery } from '#/state/queries/actor-starter-packs';
import {
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as css from '#/components/dialogs/StarterPackDialog.css';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { StarterPack } from '#/components/icons/StarterPack';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { AvatarStack } from '#/components/web/AvatarStack';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type StarterPackWithMembership = AppBskyGraphGetStarterPacksWithMembership.StarterPackWithMembership;

type StarterPackDialogProps = {
	handle: Dialog.DialogHandle;
	targetDid: string;
};

export function StarterPackDialog({ handle, targetDid }: StarterPackDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup scroll="body" label={m['common.starterPack.action.add']()}>
				<DialogInner handle={handle} targetDid={targetDid} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, targetDid }: StarterPackDialogProps) {
	const navigation = useNavigation<NavigationProp>();
	const { data: subject } = useProfileQuery({ did: targetDid });

	const { data, isError, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
		useActorStarterPacksWithMembershipsQuery({ did: targetDid });

	const membershipItems = data?.pages.flatMap((page) => page.starterPacksWithMembership) ?? [];

	const onStartWizard = () => {
		handle.close();
		navigation.navigate('StarterPackWizard', {
			fromDialog: true,
			targetDid,
			onSuccess: () => {
				setTimeout(() => {
					if (!handle.isOpen) {
						handle.open(null);
					}
				}, 0);
			},
		});
	};

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		void fetchNextPage();
	};

	return (
		<>
			<div className={css.header}>
				<div className={css.headerRow}>
					<Text size="lg" weight="semiBold">
						{m['common.starterPack.action.add']()}
					</Text>
					<Button
						className={css.closeButton}
						color="secondary"
						label={m['common.action.close']()}
						onClick={() => handle.close()}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={XIcon} />
					</Button>
				</div>
				{membershipItems.length > 0 && (
					<div className={css.subHeaderRow}>
						<Text size="md" weight="semiBold">
							{m['components.dialogs.starterPack.newTitle']()}
						</Text>
						<Button
							color="secondary_inverted"
							label={m['components.dialogs.starterPack.createTitle']()}
							onClick={onStartWizard}
							size="small"
						>
							<ButtonText>{m['common.action.create']()}</ButtonText>
							<ButtonIcon icon={PlusIcon} />
						</Button>
					</div>
				)}
			</div>
			<Dialog.List
				className={css.list}
				data={membershipItems}
				keyExtractor={(item) => item.starterPack.uri}
				renderItem={(item) => (
					<StarterPackItem starterPackWithMembership={item} subject={subject} targetDid={targetDid} />
				)}
				onEndReached={onEndReached}
				isFetchingNextPage={isFetchingNextPage}
				loadingLabel={m['common.status.loading']()}
				ListEmptyComponent={
					isLoading ? (
						<div className={css.loading}>
							<CenteredSpinner label={m['common.status.loading']()} size="lg" />
						</div>
					) : (
						<Empty onStartWizard={onStartWizard} />
					)
				}
			/>
		</>
	);
}

function Empty({ onStartWizard }: { onStartWizard: () => void }) {
	return (
		<div className={css.empty}>
			<div className={css.emptyText}>
				<StarterPack width={48} fill={colors.contrast_200} />
				<Text align="center">{m['components.dialogs.starterPack.empty']()}</Text>
			</div>
			<Button
				color="secondary_inverted"
				label={m['components.dialogs.starterPack.createTitle']()}
				onClick={onStartWizard}
				size="small"
			>
				<ButtonText>{m['common.action.create']()}</ButtonText>
				<ButtonIcon icon={PlusIcon} />
			</Button>
		</div>
	);
}

function StarterPackItem({
	starterPackWithMembership,
	subject,
	targetDid,
}: {
	starterPackWithMembership: StarterPackWithMembership;
	subject?: AnyProfileView;
	targetDid: string;
}) {
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const isSelf = subject?.did === currentAccount?.did;

	const starterPack = starterPackWithMembership.starterPack;
	const isInPack = !!starterPackWithMembership.listItem;

	const { mutate: addMembership, isPending: isPendingAdd } = useListMembershipAddMutation({
		subject,
		onSuccess: () => {
			Toast.show(m['components.dialogs.starterPack.addedToast']());
		},
		onError: (err) => {
			if (!isNetworkError(err)) {
				logger.error('Failed to add to starter pack', { safeMessage: err });
			}
			Toast.show(m['components.dialogs.starterPack.error.add'](), { type: 'error' });
		},
	});

	const { mutate: removeMembership, isPending: isPendingRemove } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(m['components.dialogs.starterPack.removedToast']());
		},
		onError: (err) => {
			if (!isNetworkError(err)) {
				logger.error('Failed to remove from starter pack', { safeMessage: err });
			}
			Toast.show(m['components.dialogs.starterPack.error.remove'](), { type: 'error' });
		},
	});

	const isPending = isPendingAdd || isPendingRemove;

	const handleToggleMembership = () => {
		if (!starterPack.list?.uri || isPending) {
			return;
		}

		const listUri = starterPack.list.uri;

		if (!isInPack) {
			addMembership({ actorDid: targetDid, listUri });
		} else {
			if (!starterPackWithMembership.listItem?.uri) {
				logger.error('Cannot remove from starter pack: missing membership URI');
				return;
			}
			removeMembership({
				actorDid: targetDid,
				listUri,
				membershipUri: starterPackWithMembership.listItem.uri,
			});
		}
	};

	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	const sample = starterPack.listItemsSample ?? [];
	const listItemCount = starterPack.list?.listItemCount ?? 0;

	return (
		<div className={css.item}>
			<div className={css.itemInfo}>
				<Text numberOfLines={1} size="md" weight="semiBold">
					{record.name}
				</Text>
				{sample.length > 0 && (
					<div className={css.itemMeta}>
						<AvatarStack
							moderationOpts={moderationOpts}
							profiles={sample.slice(0, 4).map((p) => p.subject as AnyProfileView)}
							size={24}
						/>
						{listItemCount > 4 && (
							<Text className={css.moreCount} color="textContrastMedium" size="sm">
								{m['components.dialogs.list.moreCount']({ count: listItemCount - 4 })}
							</Text>
						)}
					</div>
				)}
			</div>
			<Button
				color={isInPack ? 'secondary' : 'primary_subtle'}
				disabled={isPending || isSelf}
				label={isInPack ? m['common.action.remove']() : m['common.action.add']()}
				onClick={handleToggleMembership}
			>
				{isPending && <ButtonIcon icon={Loader} />}
				<ButtonText>
					{isSelf
						? m['components.dialogs.list.owner']()
						: isInPack
							? m['common.action.remove']()
							: m['common.action.add']()}
				</ButtonText>
			</Button>
		</div>
	);
}
