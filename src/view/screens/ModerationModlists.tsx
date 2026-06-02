import { useCallback } from 'react';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui, Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';

import { MyLists } from '#/view/com/lists/MyLists';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Layout from '#/components/Layout';
import * as Sheet from '#/components/web/Sheet';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>;
export function ModerationModlistsScreen({}: Props) {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const createListHandle = Sheet.useSheetHandle();

	const onPressNewList = useCallback(() => {
		createListHandle.open(null);
	}, [createListHandle]);

	const onCreateList = useCallback(
		(uri: string) => {
			try {
				const urip = parseCanonicalResourceUri(uri);
				navigation.navigate('ProfileList', {
					name: urip.repo,
					rkey: urip.rkey,
				});
			} catch {}
		},
		[navigation],
	);

	return (
		<Layout.Screen testID="moderationModlistsScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content align="left">
					<Layout.Header.TitleText>
						<Trans>Moderation Lists</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Button
					label={l`New list`}
					testID="newModListBtn"
					color="secondary"
					variant="solid"
					size="small"
					onPress={onPressNewList}
				>
					<ButtonIcon icon={PlusIcon} />
					<ButtonText>
						<Trans context="action">New</Trans>
					</ButtonText>
				</Button>
			</Layout.Header.Outer>
			<MyLists filter="mod" style={a.flex_grow} />
			<CreateOrEditListDialog
				purpose="app.bsky.graph.defs#modlist"
				handle={createListHandle}
				onSave={onCreateList}
			/>
		</Layout.Screen>
	);
}
