import { setElementVars } from '@vanilla-extract/dynamic';
import { getVarName } from '@vanilla-extract/private';

import { type Device, device, useStorageValue } from '#/storage';
import { colors } from '#/styles/colors';
import {
	fontFamilyVar,
	fontScale as fontScaleVar,
	systemFontFamily,
	themeFontFamily,
} from '#/styles/tokens.css';

/** theme name, including low-contrast variants. */
export type ThemeName = 'light' | 'dark' | 'dim';

type ColorMode = NonNullable<Device['colorMode']>;
type DarkTheme = NonNullable<Device['darkTheme']>;
type FontFamily = NonNullable<Device['fontFamily']>;
type FontScale = NonNullable<Device['fontScale']>;

const factor = 0.0625; // one 1/16 step per font-size preference notch
const fontScaleMultipliers: Record<FontScale, number> = {
	'-2': 1 - factor * 1, // unused
	'-1': 1 - factor * 1,
	'0': 1, // default
	'1': 1 + factor * 1,
	'2': 1 + factor * 1, // unused
};

// #region document

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const getThemeName = (): ThemeName => {
	const colorMode = device.get(['colorMode']) ?? 'system';

	if (colorMode === 'light' || (colorMode === 'system' && !prefersDark.matches)) {
		return 'light';
	}

	return device.get(['darkTheme']) ?? 'dim';
};

const applyTheme = () => {
	const theme = getThemeName();

	const html = document.documentElement;
	html.classList.toggle('theme--dark', theme === 'dark');
	html.classList.toggle('theme--dim', theme === 'dim');
	html.classList.toggle('theme--light', theme === 'light');

	const meta = document.querySelector('meta[name="theme-color"]');
	const bgColor = getComputedStyle(html).getPropertyValue(getVarName(colors.bg)).trim();
	meta?.setAttribute('content', bgColor);

	try {
		// read back by the boot script in `web/index.html` to paint the theme before we load
		localStorage.setItem('ALF_THEME', theme);
	} catch {}
};

const applyFont = () => {
	const fontFamily = device.get(['fontFamily']) ?? 'theme';
	const fontScale = device.get(['fontScale']) ?? '0';

	setElementVars(document.documentElement, {
		[fontFamilyVar]: fontFamily === 'theme' ? themeFontFamily : systemFontFamily,
		[fontScaleVar]: String(fontScaleMultipliers[fontScale]),
	});
};

/** initializes appearance preferences and attaches storage listeners. */
export const initAppearance = () => {
	prefersDark.addEventListener('change', applyTheme);
	device.onScopeChange(['colorMode'], applyTheme);
	device.onScopeChange(['darkTheme'], applyTheme);
	device.onScopeChange(['fontFamily'], applyFont);
	device.onScopeChange(['fontScale'], applyFont);

	applyTheme();
	applyFont();
};

// #endregion

// #region preferences

/**
 * returns the color mode preference.
 *
 * @returns color mode preference
 */
export const useColorMode = (): ColorMode => {
	return useStorageValue(device, ['colorMode']) ?? 'system';
};

/**
 * returns the dark theme preference.
 *
 * @returns dark theme preference
 */
export const useDarkTheme = (): DarkTheme => {
	return useStorageValue(device, ['darkTheme']) ?? 'dim';
};

/**
 * returns the font family preference.
 *
 * @returns font family preference
 */
export const useFontFamily = (): FontFamily => {
	return useStorageValue(device, ['fontFamily']) ?? 'theme';
};

/**
 * returns the font scale preference.
 *
 * @returns font scale preference
 */
export const useFontScale = (): FontScale => {
	return useStorageValue(device, ['fontScale']) ?? '0';
};

/**
 * returns the font scale multiplier for the current font scale.
 *
 * @returns font scale multiplier
 */
export const useFontScaleMultiplier = (): number => {
	return fontScaleMultipliers[useFontScale()];
};

/**
 * sets the color mode preference.
 *
 * @param colorMode color mode preference
 */
export const setColorMode = (colorMode: ColorMode) => {
	device.set(['colorMode'], colorMode);
};

/**
 * sets the dark theme preference.
 *
 * @param darkTheme dark theme preference
 */
export const setDarkTheme = (darkTheme: DarkTheme) => {
	device.set(['darkTheme'], darkTheme);
};

/**
 * sets the font family preference.
 *
 * @param fontFamily font family preference
 */
export const setFontFamily = (fontFamily: FontFamily) => {
	device.set(['fontFamily'], fontFamily);
};

/**
 * sets the font scale preference.
 *
 * @param fontScale font scale preference
 */
export const setFontScale = (fontScale: FontScale) => {
	device.set(['fontScale'], fontScale);
};

// #endregion
