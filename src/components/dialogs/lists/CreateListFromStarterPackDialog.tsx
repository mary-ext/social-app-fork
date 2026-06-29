import { View } from 'react-native';
import type { AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import type { NavigationProp } from '#/lib/routes/types';

import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { Admonition } from '#/components/Admonition';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useDialogHandle } from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import { CreateOrEditListDialog } from './CreateOrEditListDialog';

export function CreateListFromStarterPackDialog({
	control,
	starterPack,
}: {
	control: Dialog.DialogControlProps;
	starterPack: AppBskyGraphDefs.StarterPackView;
}) {
	const t = useTheme();
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const queryClient = useQueryClient();
	const createListHandle = useDialogHandle();
	const loadingDialogControl = Dialog.useDialogControl();

	const record = starterPack.record as AppBskyGraphStarterpack.Main;

	const onPressCreate = () => {
		control.close(() => createListHandle.open(null));
	};

	const addMembersAndNavigate = (listUri: string) => {
		const navigateToList = () => {
			const urip = parseCanonicalResourceUri(listUri);
			navigation.navigate('ProfileList', {
				name: urip.repo,
				rkey: urip.rkey,
			});
		};

		if (!starterPack.list || !currentAccount) {
			loadingDialogControl.close(navigateToList);
			return;
		}

		try {
			// Fetch all members and add them, with minimum 3s duration for UX

			void queryClient.invalidateQueries({ queryKey: ['list-members', listUri] });
		} catch (e) {
			logger.error('Failed to add members to list', { safeMessage: e });
			Toast.show(m['components.dialogs.list.error.createdPartial'](), {
				type: 'error',
			});
		}

		loadingDialogControl.close(navigateToList);
	};

	const onListCreated = (listUri: string) => {
		loadingDialogControl.open();
		void addMembersAndNavigate(listUri);
	};

	return (
		<>
			<Dialog.Outer control={control} testID="createListFromStarterPackDialog">
				<Dialog.Handle />
				<Dialog.ScrollableInner
					label={m['components.dialogs.list.createFromStarterPack']()}
					style={{ maxWidth: 400 }}
				>
					<View style={[a.gap_lg]}>
						<Text style={[a.text_xl, a.font_bold]}>
							{m['components.dialogs.list.createFromStarterPack']()}
						</Text>

						<Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
							{m['components.dialogs.starterPack.cloneDescription']()}
						</Text>

						<Admonition type="tip">{m['components.dialogs.starterPack.copyNotice']()}</Admonition>

						<View style={[a.flex_row_reverse, a.gap_md, a.pt_sm]}>
							<Button
								label={m['components.dialogs.list.createTitle']()}
								onPress={onPressCreate}
								size={'small'}
								color="primary"
							>
								<ButtonText>{m['components.dialogs.list.createTitle']()}</ButtonText>
							</Button>
							<Button
								label={m['common.action.cancel']()}
								onPress={() => control.close()}
								size={'small'}
								color="secondary"
							>
								<ButtonText>{m['common.action.cancel']()}</ButtonText>
							</Button>
						</View>
					</View>
					<Dialog.Close />
				</Dialog.ScrollableInner>
			</Dialog.Outer>
			<CreateOrEditListDialog
				handle={createListHandle}
				purpose="app.bsky.graph.defs#curatelist"
				onSave={onListCreated}
				initialValues={{
					name: record.name,
					description: record.description,
					avatar: starterPack.list?.avatar,
				}}
			/>
			<Dialog.Outer control={loadingDialogControl}>
				<Dialog.Handle />
				<Dialog.ScrollableInner
					label={m['components.dialogs.list.addingMembers']()}
					style={{ maxWidth: 400 }}
				>
					<View style={[a.align_center, a.gap_lg, a.py_5xl]}>
						<Loader size="2xl" />
						<Text style={[a.text_lg, t.atoms.text_contrast_high]}>
							{m['components.dialogs.list.addingMembers']()}
						</Text>
					</View>
				</Dialog.ScrollableInner>
			</Dialog.Outer>
		</>
	);
}
