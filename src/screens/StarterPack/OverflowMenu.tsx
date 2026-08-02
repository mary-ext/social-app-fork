import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/strings/errors';

import { useDeleteStarterPackMutation } from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { CreateListFromStarterPackDialog } from '#/components/dialogs/lists/CreateListFromStarterPackDialog';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import ChainLinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import Ellipsis from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import ListSparkle from '#/icons/central/ListSparkle_round_outlined_radius1_stroke2.svg';
import Pencil from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import Trash from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { type RouteParams, useRouter } from '#/routes';
import { colors } from '#/styles/colors';

import * as css from './StarterPackScreen.css';

const PromptSpinner = () => <Spinner color="white" label={m['common.status.saving']()} size="sm" />;

export function OverflowMenu({
	starterPack,
	routeParams,
	onOpenShareDialog,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	routeParams: RouteParams<'StarterPack'>;
	onOpenShareDialog: () => void;
}) {
	const { currentAccount } = useSession();
	const reportDialogHandle = Dialog.useDialogHandle();
	const deleteHandle = Prompt.usePromptHandle();
	const convertToListHandle = Dialog.useDialogHandle();
	const router = useRouter();

	const {
		mutate: deleteStarterPack,
		isPending: isDeletePending,
		error: deleteError,
	} = useDeleteStarterPackMutation({
		onSuccess: () => {
			deleteHandle.close();
			// the pack was just deleted; leave for Home.
			router.popTo({ name: 'Home' });
		},
		onError: (e) => {
			console.error('Failed to delete starter pack', e);
		},
	});

	const isOwn = starterPack.creator.did === currentAccount?.did;

	const onDeleteStarterPack = () => {
		if (!starterPack.list) {
			console.error('Unable to delete starterpack because list is missing');
			return;
		}

		deleteStarterPack({
			rkey: routeParams.rkey,
			listUri: starterPack.list.uri,
		});
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							label={m['screens.starterPack.a11y.openMenu']()}
							variant="solid"
							color="secondary"
							size="small"
							shape="round"
						>
							<ButtonIcon icon={Ellipsis} />
						</Button>
					}
				/>
				<Menu.Popup label={m['screens.starterPack.a11y.options']()} minWidth={170} align="end">
					{isOwn ? (
						<>
							<Menu.Item
								label={m['screens.starterPack.edit']()}
								onClick={() => {
									router.navigate({
										to: { name: 'StarterPackEdit', actor: routeParams.actor, rkey: routeParams.rkey },
									});
								}}
							>
								<Menu.ItemText>{m['common.action.edit']()}</Menu.ItemText>
								<Menu.ItemIcon icon={Pencil} position="right" />
							</Menu.Item>
							<Menu.Item
								label={m['screens.starterPack.delete.action']()}
								onClick={() => deleteHandle.open(null)}
							>
								<Menu.ItemText>{m['common.action.delete']()}</Menu.ItemText>
								<Menu.ItemIcon icon={Trash} position="right" />
							</Menu.Item>
							<Menu.Item
								label={m['screens.starterPack.list.create']()}
								onClick={() => {
									convertToListHandle.open(null);
								}}
							>
								<Menu.ItemText>{m['screens.starterPack.list.createFromMembers']()}</Menu.ItemText>
								<Menu.ItemIcon icon={ListSparkle} position="right" />
							</Menu.Item>
						</>
					) : (
						<>
							<Menu.Group>
								<Menu.Item label={m['screens.starterPack.share.copyLink']()} onClick={onOpenShareDialog}>
									<Menu.ItemText>{m['common.share.action.copyLink']()}</Menu.ItemText>
									<Menu.ItemIcon icon={ChainLinkIcon} position="right" />
								</Menu.Item>
							</Menu.Group>

							<Menu.Item
								label={m['screens.starterPack.report']()}
								onClick={() => reportDialogHandle.open(null)}
							>
								<Menu.ItemText>{m['screens.starterPack.report']()}</Menu.ItemText>
								<Menu.ItemIcon icon={CircleInfo} position="right" />
							</Menu.Item>
						</>
					)}
				</Menu.Popup>
			</Menu.Root>
			{starterPack.list && (
				<ReportDialog
					handle={reportDialogHandle}
					subject={{
						$type: 'app.bsky.graph.defs#starterPackView',
						...starterPack,
					}}
				/>
			)}
			<Prompt.Outer handle={deleteHandle}>
				<Prompt.Content>
					<Prompt.TitleText>{m['screens.starterPack.delete.title']()}</Prompt.TitleText>
					<Prompt.DescriptionText>{m['screens.starterPack.delete.message']()}</Prompt.DescriptionText>

					{deleteError && (
						<div className={css.error.root}>
							<div className={css.error.body}>
								<Text weight="semiBold">{m['screens.starterPack.delete.error.unable']()}</Text>
								<Text>{cleanError(deleteError)}</Text>
							</div>

							<CircleInfo size="lg" fill={colors.negative_400} />
						</div>
					)}
				</Prompt.Content>

				<Prompt.Actions>
					<Prompt.Action
						onPress={() => onDeleteStarterPack()}
						color="negative"
						cta={m['common.action.delete']()}
						icon={isDeletePending ? PromptSpinner : undefined}
						shouldCloseOnPress={false}
					/>
					<Prompt.Cancel />
				</Prompt.Actions>
			</Prompt.Outer>
			<CreateListFromStarterPackDialog handle={convertToListHandle} starterPack={starterPack} />
		</>
	);
}
