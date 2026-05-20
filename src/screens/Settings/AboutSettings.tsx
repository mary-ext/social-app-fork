import { Platform } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';

import { getDeviceId } from '#/lib/device-id';
import { type CommonNavigatorParams } from '#/lib/routes/types';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import { CodeLines_Stroke2_Corner2_Rounded as CodeLinesIcon } from '#/components/icons/CodeLines';
import { Wrench_Stroke2_Corner2_Rounded as WrenchIcon } from '#/components/icons/Wrench';
import * as Layout from '#/components/Layout';
import * as Toast from '#/components/Toast';
import * as env from '#/env';
import { setStringAsync } from '#/shims/clipboard';
import { useDemoMode } from '#/storage/hooks/demo-mode';
import { useDevMode } from '#/storage/hooks/dev-mode';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AboutSettings'>;
export function AboutSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const [devModeEnabled, setDevModeEnabled] = useDevMode();
	const [] = useDemoMode();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>About</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.LinkItem to="/sys/log" label={l`System log`}>
						<SettingsList.ItemIcon icon={CodeLinesIcon} />
						<SettingsList.ItemText>
							<Trans>System log</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.PressableItem
						label={l`Version ${env.APP_VERSION}`}
						accessibilityHint={l`Copies build version to clipboard`}
						onLongPress={() => {
							const newDevModeEnabled = !devModeEnabled;
							setDevModeEnabled(newDevModeEnabled);
							Toast.show(
								newDevModeEnabled
									? l({
											message: 'Developer mode enabled',
											context: 'toast',
										})
									: l({
											message: 'Developer mode disabled',
											context: 'toast',
										}),
							);
						}}
						onPress={() => {
							setStringAsync(
								`Build version: ${env.APP_VERSION}; Bundle info: ${env.APP_METADATA}; Bundle date: ${env.BUNDLE_DATE}; Platform: ${'web'}; Platform version: ${Platform.Version}; Device ID: ${getDeviceId()}`,
							);
							Toast.show(l`Copied build version to clipboard`);
						}}
					>
						<SettingsList.ItemIcon icon={WrenchIcon} />
						<SettingsList.ItemText>
							<Trans>Version {env.APP_VERSION}</Trans>
						</SettingsList.ItemText>
						<SettingsList.BadgeText>{env.APP_METADATA}</SettingsList.BadgeText>
					</SettingsList.PressableItem>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}
