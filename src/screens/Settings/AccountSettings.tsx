import { useLingui, Trans } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import * as SettingsList from '#/screens/Settings/components/SettingsList';

import { isBotAccount } from '#/components/BotBadge';
import { useDialogControl } from '#/components/Dialog';
import { Bot_Stroke as RobotIcon } from '#/components/icons/Bot';
import { Car_Stroke2_Corner2_Rounded as CarIcon } from '#/components/icons/Car';
import * as Layout from '#/components/Layout';

import { ExportCarDialog } from './components/ExportCarDialog';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccountSettings'>;
export function AccountSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const exportCarControl = useDialogControl();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Account</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.LinkItem to="/settings/automation-label" label={l`Automation label`}>
						<SettingsList.ItemIcon icon={RobotIcon} />
						<SettingsList.ItemText>
							<Trans>Automation label</Trans>
						</SettingsList.ItemText>
						{profile && (
							<SettingsList.BadgeText>{isBotAccount(profile) ? l`On` : l`Off`}</SettingsList.BadgeText>
						)}
					</SettingsList.LinkItem>
					<SettingsList.Divider />
					<SettingsList.PressableItem label={l`Export my data`} onPress={() => exportCarControl.open()}>
						<SettingsList.ItemIcon icon={CarIcon} />
						<SettingsList.ItemText>
							<Trans>Export my data</Trans>
						</SettingsList.ItemText>
						<SettingsList.Chevron />
					</SettingsList.PressableItem>
				</SettingsList.Container>
			</Layout.Content>
			<ExportCarDialog control={exportCarControl} />
		</Layout.Screen>
	);
}
