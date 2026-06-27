import { useCallback } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { useUpdateActorDeclaration } from '#/state/queries/messages/actor-declaration';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ExportCarDialog } from '#/screens/Settings/components/ExportCarDialog';

import { atoms as a, useTheme } from '#/alf';

import { Divider } from '#/components/Divider';
import { resolveAllowGroupInvites } from '#/components/dms/util';
import * as Toggle from '#/components/forms/Toggle';
import { Car_Stroke2_Corner2_Rounded as CarIcon } from '#/components/icons/Car';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import * as Layout from '#/components/Layout';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './Settings.css';

type AllowIncoming = 'all' | 'none' | 'following';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>;

export function MessagesSettingsScreen(props: Props) {
	return <MessagesSettingsScreenInner {...props} />;
}

export function MessagesSettingsScreenInner({}: Props) {
	const t = useTheme();
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({
		did: currentAccount!.did,
	});
	const exportCarHandle = Dialog.useDialogHandle();

	const allowMessagesFromOptions: { name: AllowIncoming; label: string }[] = [
		{
			name: 'all',
			label: m['screens.messages.option.everyoneMessages'](),
		},
		{
			name: 'following',
			label: m['screens.messages.option.followingMessages'](),
		},
		{
			name: 'none',
			label: m['screens.messages.option.noOneMessages'](),
		},
	];

	const allowGroupInvitesFromOptions: { name: AllowIncoming; label: string }[] = [
		{
			name: 'all',
			label: m['screens.messages.option.everyoneInvites'](),
		},
		{
			name: 'following',
			label: m['screens.messages.option.followingInvites'](),
		},
		{
			name: 'none',
			label: m['screens.messages.option.noOneInvites'](),
		},
	];

	const { mutate: updateDeclaration } = useUpdateActorDeclaration({
		onError: () => {
			Toast.show(m['screens.messages.error.updateSettings'](), {
				type: 'error',
			});
		},
	});

	const onSelectMessagesFrom = useCallback(
		(keys: string[]) => {
			const key = keys[0];
			if (!key) return;
			updateDeclaration({ allowIncoming: key as AllowIncoming });
		},
		[updateDeclaration],
	);

	const onSelectGroupInvitesFrom = useCallback(
		(keys: string[]) => {
			const key = keys[0];
			if (!key) return;
			updateDeclaration({ allowGroupInvites: key as AllowIncoming });
		},
		[updateDeclaration],
	);

	return (
		<Layout.Screen testID="messagesSettingsScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.messages.title.chatSettings']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<View style={[a.py_xl, a.gap_md]}>
					<View style={[a.px_xl]}>
						<Text style={[a.pb_xs, a.text_md, a.font_semi_bold, t.atoms.text]}>
							{m['screens.messages.label.allowDmFrom']()}
						</Text>
						<Text style={[a.pb_md, a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}>
							{m['screens.messages.hint.ongoingConversations']()}
						</Text>
						<Toggle.Group
							label={m['screens.messages.label.allowDmFrom']()}
							type="radio"
							values={[(profile?.associated?.chat?.allowIncoming as AllowIncoming) ?? 'following']}
							onChange={onSelectMessagesFrom}
						>
							<View>
								{allowMessagesFromOptions.map((option) => (
									<Toggle.Item key={option.name} highlightRow name={option.name} label={option.label}>
										{({ selected }) => <Toggle.RadioWithLabel label={option.label} selected={selected} />}
									</Toggle.Item>
								))}
							</View>
						</Toggle.Group>
					</View>
					<Divider style={{ marginVertical: 10 }} />
					<View style={[a.px_xl]}>
						<Text style={[a.pb_xs, a.text_md, a.font_semi_bold, t.atoms.text]}>
							{m['screens.messages.label.allowInvitesFrom']()}
						</Text>
						<Text style={[a.pb_md, a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}>
							{m['screens.messages.hint.ongoingConversations']()}
						</Text>
						<Toggle.Group
							label={m['screens.messages.label.allowInvitesFrom']()}
							type="radio"
							values={[resolveAllowGroupInvites(profile?.associated?.chat)]}
							onChange={onSelectGroupInvitesFrom}
						>
							<View>
								{allowGroupInvitesFromOptions.map((option) => (
									<Toggle.Item key={option.name} highlightRow name={option.name} label={option.label}>
										{({ selected }) => <Toggle.RadioWithLabel label={option.label} selected={selected} />}
									</Toggle.Item>
								))}
							</View>
						</Toggle.Group>
					</View>
					<Divider style={{ marginVertical: 10 }} />

					<View style={[a.px_xl]}>
						<Toggle.Item
							label={m['common.action.exportChatData']()}
							name="exportChatData"
							style={[a.flex_row, a.align_center, a.justify_between]}
							onChange={() => {
								exportCarHandle.open(null);
							}}
						>
							<CarIcon className={css.carIcon} fill={colors.text} size="lg" />
							<Text style={[a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text]}>
								{m['screens.messages.action.exportChatData']()}
							</Text>
							<ChevronRightIcon className={css.chevron} fill={colors.text} size="md" />
						</Toggle.Item>
					</View>
					<Divider style={{ marginVertical: 10 }} />
				</View>
			</Layout.Content>
			<ExportCarDialog handle={exportCarHandle} />
		</Layout.Screen>
	);
}
