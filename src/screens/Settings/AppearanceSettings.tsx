import { useCallback } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useSetThemePrefs, useThemePrefs } from '#/state/shell';

import { type Alf, useAlf } from '#/alf';

import type { Props as SVGIconProps } from '#/components/icons/common';
import { Moon_Stroke2_Corner0_Rounded as MoonIcon } from '#/components/icons/Moon';
import { Phone_Stroke2_Corner0_Rounded as PhoneIcon } from '#/components/icons/Phone';
import { TextSize_Stroke2_Corner0_Rounded as TextSize } from '#/components/icons/TextSize';
import { TitleCase_Stroke2_Corner0_Rounded as Aa } from '#/components/icons/TitleCase';
import { SegmentedControl, type SegmentedControlItem } from '#/components/SegmentedControl';
import * as SettingsList from '#/components/SettingsList';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import * as styles from './AppearanceSettings.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>;
export function AppearanceSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { fonts } = useAlf();

	const { colorMode, darkTheme } = useThemePrefs();
	const { setColorMode, setDarkTheme } = useSetThemePrefs();

	const onChangeAppearance = useCallback(
		(value: 'dark' | 'light' | 'system') => {
			setColorMode(value);
		},
		[setColorMode],
	);

	const onChangeDarkTheme = useCallback(
		(value: 'dark' | 'dim') => {
			setDarkTheme(value);
		},
		[setDarkTheme],
	);

	const onChangeFontFamily = useCallback(
		(value: 'system' | 'theme') => {
			fonts.setFontFamily(value);
		},
		[fonts],
	);

	const onChangeFontScale = useCallback(
		(value: Alf['fonts']['scale']) => {
			fonts.setFontScale(value);
		},
		[fonts],
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Appearance</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<AppearanceGroup
						title={l`Color mode`}
						icon={PhoneIcon}
						items={[
							{ label: l`System`, value: 'system' },
							{ label: l`Light`, value: 'light' },
							{ label: l`Dark`, value: 'dark' },
						]}
						value={colorMode}
						onValueChange={onChangeAppearance}
					/>

					{colorMode !== 'light' && (
						<AppearanceGroup
							title={l`Dark theme`}
							icon={MoonIcon}
							items={[
								{ label: l`Dim`, value: 'dim' },
								{ label: l`Dark`, value: 'dark' },
							]}
							value={darkTheme ?? 'dim'}
							onValueChange={onChangeDarkTheme}
						/>
					)}

					<SettingsList.Divider />
					<AppearanceGroup
						title={l`Font`}
						description={l`For the best experience, we recommend using the theme font.`}
						icon={Aa}
						items={[
							{ label: l`System`, value: 'system' },
							{ label: l`Theme`, value: 'theme' },
						]}
						value={fonts.family}
						onValueChange={onChangeFontFamily}
					/>
					<AppearanceGroup
						title={l`Font size`}
						icon={TextSize}
						items={[
							{ label: l`Smaller`, value: '-1' },
							{ label: l`Default`, value: '0' },
							{ label: l`Larger`, value: '1' },
						]}
						value={fonts.scale}
						onValueChange={onChangeFontScale}
					/>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

function AppearanceGroup<T extends string>({
	title,
	description,
	icon,
	items,
	value,
	onValueChange,
}: {
	title: string;
	description?: string;
	icon: React.ComponentType<SVGIconProps>;
	items: SegmentedControlItem<T>[];
	value: T;
	onValueChange: (value: T) => void;
}) {
	return (
		<SettingsList.Group>
			<div className={styles.groupBody}>
				<div className={styles.headerRow}>
					<SettingsList.ItemIcon icon={icon} />
					<SettingsList.ItemText>{title}</SettingsList.ItemText>
				</div>
				{description && (
					<Text size="sm" leading="snug" color="textContrastMedium">
						{description}
					</Text>
				)}
				<SegmentedControl label={title} items={items} value={value} onValueChange={onValueChange} />
			</div>
		</SettingsList.Group>
	);
}
