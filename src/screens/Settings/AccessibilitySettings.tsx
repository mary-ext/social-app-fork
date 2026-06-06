import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import * as Layout from '#/components/web/Layout';
import * as SettingsList from '#/components/web/SettingsList';

import { useRequireAltTextEnabled } from '#/storage/hooks/alt-text-required';
import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

import * as styles from './AccessibilitySettings.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccessibilitySettings'>;
export function AccessibilitySettingsScreen({}: Props) {
	const { t: l } = useLingui();

	const [requireAltTextEnabled, setRequireAltTextEnabled] = useRequireAltTextEnabled();
	const [largeAltBadgeEnabled, setLargeAltBadgeEnabled] = useLargeAltBadgeEnabled();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Accessibility</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.Group>
						<div className={styles.groupBody}>
							<div className={styles.headerRow}>
								<SettingsList.ItemIcon icon={AccessibilityIcon} />
								<SettingsList.ItemText>
									<Trans>Alt text</Trans>
								</SettingsList.ItemText>
							</div>
							<div className={styles.insetColumn}>
								<SettingsList.CheckboxItem
									flush
									label={l`Require alt text before posting`}
									value={requireAltTextEnabled ?? false}
									onChange={setRequireAltTextEnabled}
								>
									<SettingsList.LabelText>
										<Trans>Require alt text before posting</Trans>
									</SettingsList.LabelText>
									<SettingsList.CheckboxBox />
								</SettingsList.CheckboxItem>
								<SettingsList.CheckboxItem
									flush
									label={l`Display larger alt text badges`}
									value={!!largeAltBadgeEnabled}
									onChange={setLargeAltBadgeEnabled}
								>
									<SettingsList.LabelText>
										<Trans>Display larger alt text badges</Trans>
									</SettingsList.LabelText>
									<SettingsList.CheckboxBox />
								</SettingsList.CheckboxItem>
							</div>
						</div>
					</SettingsList.Group>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}
