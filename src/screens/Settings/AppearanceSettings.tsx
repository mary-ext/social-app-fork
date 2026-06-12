import { useCallback } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useSetThemePrefs, useThemePrefs } from '#/state/shell';

import { type Alf, useAlf } from '#/alf';

import { Moon_Stroke2_Corner0_Rounded as MoonIcon } from '#/components/icons/Moon';
import { Phone_Stroke2_Corner0_Rounded as PhoneIcon } from '#/components/icons/Phone';
import { TextSize_Stroke2_Corner0_Rounded as TextSize } from '#/components/icons/TextSize';
import { TitleCase_Stroke2_Corner0_Rounded as Aa } from '#/components/icons/TitleCase';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

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
				<Settings.List>
					<Settings.Section titleText={<Trans>Theme</Trans>}>
						<Settings.SelectRow
							label={l`Color mode`}
							value={colorMode}
							onValueChange={onChangeAppearance}
							items={[
								{ label: l`System`, value: 'system' },
								{ label: l`Light`, value: 'light' },
								{ label: l`Dark`, value: 'dark' },
							]}
						>
							<Settings.Icon icon={PhoneIcon} />
							<Settings.Label titleText={<Trans>Color mode</Trans>} />
						</Settings.SelectRow>

						{colorMode !== 'light' && (
							<Settings.SelectRow
								label={l`Dark theme`}
								value={darkTheme ?? 'dim'}
								onValueChange={onChangeDarkTheme}
								items={[
									{ label: l`Dim`, value: 'dim' },
									{ label: l`Dark`, value: 'dark' },
								]}
							>
								<Settings.Icon icon={MoonIcon} />
								<Settings.Label titleText={<Trans>Dark theme</Trans>} />
							</Settings.SelectRow>
						)}
					</Settings.Section>

					<Settings.Section titleText={<Trans>Font</Trans>}>
						<Settings.SwitchRow
							label={l`Use theme font`}
							value={fonts.family === 'theme'}
							onChange={(checked) => fonts.setFontFamily(checked ? 'theme' : 'system')}
						>
							<Settings.Icon icon={Aa} />
							<Settings.Label
								titleText={<Trans>Use theme font</Trans>}
								subtitleText={<Trans>We recommend the theme font for the best experience.</Trans>}
							/>
						</Settings.SwitchRow>

						<Settings.SelectRow
							label={l`Font size`}
							value={fonts.scale}
							onValueChange={onChangeFontScale}
							items={[
								{ label: l`Smaller`, value: '-1' },
								{ label: l`Default`, value: '0' },
								{ label: l`Larger`, value: '1' },
							]}
						>
							<Settings.Icon icon={TextSize} />
							<Settings.Label titleText={<Trans>Font size</Trans>} />
						</Settings.SelectRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}
