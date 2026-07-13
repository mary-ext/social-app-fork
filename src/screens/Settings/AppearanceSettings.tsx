import { useSetThemePrefs, useThemePrefs } from '#/state/shell';

import { type Alf, useAlf } from '#/alf';

import { Moon_Stroke2_Corner0_Rounded as MoonIcon } from '#/components/icons/Moon';
import { Phone_Stroke2_Corner0_Rounded as PhoneIcon } from '#/components/icons/Phone';
import { TextSize_Stroke2_Corner0_Rounded as TextSize } from '#/components/icons/TextSize';
import { TitleCase_Stroke2_Corner0_Rounded as Aa } from '#/components/icons/TitleCase';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

export function AppearanceSettingsScreen() {
	const { fonts } = useAlf();

	const { colorMode, darkTheme } = useThemePrefs();
	const { setColorMode, setDarkTheme } = useSetThemePrefs();

	const onChangeAppearance = (value: 'dark' | 'light' | 'system') => {
		setColorMode(value);
	};

	const onChangeDarkTheme = (value: 'dark' | 'dim') => {
		setDarkTheme(value);
	};

	const onChangeFontScale = (value: Alf['fonts']['scale']) => {
		fonts.setFontScale(value);
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.appearance.label']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section titleText={m['screens.settings.appearance.theme']()}>
						<Settings.SelectRow
							label={m['screens.settings.appearance.colorMode']()}
							value={colorMode}
							onValueChange={onChangeAppearance}
							items={[
								{ label: m['screens.settings.appearance.system'](), value: 'system' },
								{ label: m['screens.settings.appearance.light'](), value: 'light' },
								{ label: m['screens.settings.appearance.dark'](), value: 'dark' },
							]}
						>
							<Settings.Icon icon={PhoneIcon} />
							<Settings.Label titleText={m['screens.settings.appearance.colorMode']()} />
						</Settings.SelectRow>

						{colorMode !== 'light' && (
							<Settings.SelectRow
								label={m['screens.settings.appearance.darkTheme']()}
								value={darkTheme ?? 'dim'}
								onValueChange={onChangeDarkTheme}
								items={[
									{ label: m['screens.settings.appearance.dim'](), value: 'dim' },
									{ label: m['screens.settings.appearance.dark'](), value: 'dark' },
								]}
							>
								<Settings.Icon icon={MoonIcon} />
								<Settings.Label titleText={m['screens.settings.appearance.darkTheme']()} />
							</Settings.SelectRow>
						)}
					</Settings.Section>

					<Settings.Section titleText={m['screens.settings.appearance.font']()}>
						<Settings.SwitchRow
							label={m['screens.settings.appearance.useThemeFont']()}
							value={fonts.family === 'theme'}
							onChange={(checked) => fonts.setFontFamily(checked ? 'theme' : 'system')}
						>
							<Settings.Icon icon={Aa} />
							<Settings.Label
								titleText={m['screens.settings.appearance.useThemeFont']()}
								subtitleText={m['screens.settings.appearance.recommendThemeFont']()}
							/>
						</Settings.SwitchRow>

						<Settings.SelectRow
							label={m['screens.settings.appearance.fontSize']()}
							value={fonts.scale}
							onValueChange={onChangeFontScale}
							items={[
								{ label: m['screens.settings.appearance.smaller'](), value: '-1' },
								{ label: m['screens.settings.audience.default'](), value: '0' },
								{ label: m['screens.settings.appearance.larger'](), value: '1' },
							]}
						>
							<Settings.Icon icon={TextSize} />
							<Settings.Label titleText={m['screens.settings.appearance.fontSize']()} />
						</Settings.SelectRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}
