import { createContext, useContext, useLayoutEffect } from 'react';

import { setElementVars } from '@vanilla-extract/dynamic';
import { getVarName } from '@vanilla-extract/private';

import { useMediaQuery } from '#/lib/media-query';

import { type Device, device, useStorage } from '#/storage';
import { colors } from '#/styles/colors';
import {
	fontFamilyVar,
	fontScale as fontScaleVar,
	systemFontFamily,
	themeFontFamily,
} from '#/styles/tokens.css';

/** Specific theme name, including low-contrast variants */
export type ThemeName = 'light' | 'dark' | 'dim';

const factor = 0.0625; // one 1/16 step per font-size preference notch
const fontScaleMultipliers: Record<Device['fontScale'], number> = {
	'-2': 1 - factor * 1, // unused
	'-1': 1 - factor * 1,
	'0': 1, // default
	'1': 1 + factor * 1,
	'2': 1 + factor * 1, // unused
};

export function computeFontScaleMultiplier(scale: Device['fontScale']) {
	return fontScaleMultipliers[scale];
}

type AppearanceContext = {
	colorMode: Exclude<Device['colorMode'], undefined>;
	darkTheme: Exclude<Device['darkTheme'], undefined>;
	fontFamily: Exclude<Device['fontFamily'], undefined>;
	fontScale: Exclude<Device['fontScale'], undefined>;
	fontScaleMultiplier: number;
	theme: ThemeName;
	setColorMode: (colorMode: Exclude<Device['colorMode'], undefined>) => void;
	setDarkTheme: (darkTheme: Exclude<Device['darkTheme'], undefined>) => void;
	setFontFamily: (fontFamily: Exclude<Device['fontFamily'], undefined>) => void;
	setFontScale: (fontScale: Exclude<Device['fontScale'], undefined>) => void;
};

const AppearanceContext = createContext<AppearanceContext>({
	colorMode: 'system',
	darkTheme: 'dim',
	fontFamily: 'theme',
	fontScale: '0',
	fontScaleMultiplier: 1,
	theme: 'light',
	setColorMode: () => {},
	setDarkTheme: () => {},
	setFontFamily: () => {},
	setFontScale: () => {},
});
AppearanceContext.displayName = 'AppearanceContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [colorMode = 'system', setColorMode] = useStorage(device, ['colorMode']);
	const [darkTheme = 'dim', setDarkTheme] = useStorage(device, ['darkTheme']);
	const [fontScale = '0', setFontScale] = useStorage(device, ['fontScale']);
	const [fontFamily = 'theme', setFontFamily] = useStorage(device, ['fontFamily']);

	const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
	const theme = getThemeName(prefersDark ? 'dark' : 'light', colorMode, darkTheme);
	const fontScaleMultiplier = computeFontScaleMultiplier(fontScale);

	useLayoutEffect(() => {
		const html = document.documentElement;
		html.classList.toggle('theme--dark', theme === 'dark');
		html.classList.toggle('theme--dim', theme === 'dim');
		html.classList.toggle('theme--light', theme === 'light');

		const meta = document.querySelector('meta[name="theme-color"]');
		const bgColor = getComputedStyle(html).getPropertyValue(getVarName(colors.bg)).trim();
		meta?.setAttribute('content', bgColor);

		localStorage.setItem('ALF_THEME', theme);
	}, [theme]);

	useLayoutEffect(() => {
		setElementVars(document.documentElement, {
			[fontFamilyVar]: fontFamily === 'theme' ? themeFontFamily : systemFontFamily,
			[fontScaleVar]: String(fontScaleMultiplier),
		});
	}, [fontFamily, fontScaleMultiplier]);

	const value: AppearanceContext = {
		colorMode,
		darkTheme,
		fontFamily,
		fontScale,
		fontScaleMultiplier,
		theme,
		setColorMode,
		setDarkTheme,
		setFontFamily,
		setFontScale,
	};

	return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
	return useContext(AppearanceContext);
}

function getThemeName(
	colorScheme: 'dark' | 'light',
	colorMode: 'system' | 'light' | 'dark',
	darkTheme?: ThemeName,
): ThemeName {
	if ((colorMode === 'system' && colorScheme === 'light') || colorMode === 'light') {
		return 'light';
	} else {
		return darkTheme ?? 'dim';
	}
}
