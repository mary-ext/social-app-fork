import { useUpdateActorDeclaration } from '#/state/queries/messages/actor-declaration';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ExportCarDialog } from '#/screens/Settings/components/ExportCarDialog';

import * as Dialog from '#/components/Dialog';
import { resolveAllowGroupInvites } from '#/components/dms/util';
import { Car_Stroke2_Corner2_Rounded as CarIcon } from '#/components/icons/Car';
import { Group3_Stroke2_Corner0_Rounded as GroupIcon } from '#/components/icons/Group';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import * as Settings from '#/components/SettingsCards';
import * as Toast from '#/components/Toast';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

type AllowIncoming = 'all' | 'following' | 'none';

export function MessagesSettingsScreen() {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount!.did });
	const exportCarHandle = Dialog.useDialogHandle();

	const audienceItems: { label: string; value: AllowIncoming }[] = [
		{ label: m['screens.settings.audience.everyone'](), value: 'all' },
		{ label: m['screens.settings.audience.peopleIFollow'](), value: 'following' },
		{ label: m['screens.settings.audience.noOne'](), value: 'none' },
	];

	const { mutate: updateDeclaration } = useUpdateActorDeclaration({
		onError: () => {
			Toast.show(m['screens.messages.chatSettings.updateError'](), {
				type: 'error',
			});
		},
	});

	const allowIncoming = (profile?.associated?.chat?.allowIncoming as AllowIncoming) ?? 'following';
	const allowGroupInvites = resolveAllowGroupInvites(profile?.associated?.chat);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.messages.chatSettings.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section
						footnoteText={m['screens.messages.dmSettings.hint']()}
						titleText={m['screens.messages.chatSettings.audienceTitle']()}
					>
						<Settings.SelectRow
							items={audienceItems}
							label={m['screens.messages.dmSettings.label']()}
							onValueChange={(value: AllowIncoming) => updateDeclaration({ allowIncoming: value })}
							value={allowIncoming}
						>
							<Settings.Icon icon={MessageIcon} />
							<Settings.Label titleText={m['screens.messages.dmSettings.label']()} />
						</Settings.SelectRow>
						<Settings.SelectRow
							items={audienceItems}
							label={m['screens.messages.inviteSettings.label']()}
							onValueChange={(value: AllowIncoming) => updateDeclaration({ allowGroupInvites: value })}
							value={allowGroupInvites}
						>
							<Settings.Icon icon={GroupIcon} />
							<Settings.Label titleText={m['screens.messages.inviteSettings.label']()} />
						</Settings.SelectRow>
					</Settings.Section>

					<Settings.Section>
						<Settings.ButtonRow
							label={m['screens.messages.export.action']()}
							onPress={() => exportCarHandle.open(null)}
						>
							<Settings.Icon icon={CarIcon} />
							<Settings.Label titleText={m['screens.messages.export.action']()} />
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<ExportCarDialog handle={exportCarHandle} />
		</Layout.Screen>
	);
}
