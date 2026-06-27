import { createContext, useContext, useEffect, useState } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import { type Theme, type ThemeName, utils as baseUtils } from '#/alf/base';
import {
	computeFontScaleMultiplier,
	getFontFamily,
	getFontScale,
	setFontFamily as persistFontFamily,
	setFontScale as persistFontScale,
} from '#/alf/fonts';
import { themes } from '#/alf/themes';

import type { Device } from '#/storage';
import { fontScale as fontScaleVar } from '#/styles/tokens.css';

export { atoms } from '#/alf/atoms';
export { type TextStyleProp, type Theme, type ThemeName, type ViewStyleProp } from '#/alf/base';
export * from '#/alf/breakpoints';
export * from '#/alf/fonts';
export * as tokens from '#/alf/tokens';
export * from '#/alf/util/flatten';
export * from '#/alf/util/themeSelector';
export * from '#/alf/util/useGutters';
export const utils = { ...baseUtils };

export type Alf = {
	themeName: ThemeName;
	theme: Theme;
	themes: typeof themes;
	fonts: {
		scale: Exclude<Device['fontScale'], undefined>;
		scaleMultiplier: number;
		family: Device['fontFamily'];
		setFontScale: (fontScale: Exclude<Device['fontScale'], undefined>) => void;
		setFontFamily: (fontFamily: Device['fontFamily']) => void;
	};
	/** Feature flags or other gated options */
	flags: {};
};

/*
 * Context
 */
export const Context = createContext<Alf>({
	themeName: 'light',
	theme: themes.light,
	themes,
	fonts: {
		scale: getFontScale(),
		scaleMultiplier: computeFontScaleMultiplier(getFontScale()),
		family: getFontFamily(),
		setFontScale: () => {},
		setFontFamily: () => {},
	},
	flags: {},
});
Context.displayName = 'AlfContext';

export function ThemeProvider({
	children,
	theme: themeName,
	themesOverride,
}: React.PropsWithChildren<{ theme: ThemeName; themesOverride?: Partial<typeof themes> }>) {
	const [fontScale, setFontScale] = useState<Alf['fonts']['scale']>(() => getFontScale());
	const [fontScaleMultiplier, setFontScaleMultiplier] = useState(() => computeFontScaleMultiplier(fontScale));
	const setFontScaleAndPersist = (fs: Alf['fonts']['scale']) => {
		setFontScale(fs);
		persistFontScale(fs);
		setFontScaleMultiplier(computeFontScaleMultiplier(fs));
	};
	useEffect(() => {
		// bridge the font-size preference into CSS: write the `fontScale` var onto <html> so the
		// `fontSize.*` tokens (and everything built on them) scale without per-component JS.
		const root = document.documentElement;
		const inline = assignInlineVars({ [fontScaleVar]: String(fontScaleMultiplier) });
		for (const [prop, value] of Object.entries(inline)) {
			root.style.setProperty(prop, value);
		}
	}, [fontScaleMultiplier]);

	const [fontFamily, setFontFamily] = useState<Alf['fonts']['family']>(() => getFontFamily());
	const setFontFamilyAndPersist = (ff: Alf['fonts']['family']) => {
		setFontFamily(ff);
		persistFontFamily(ff);
	};

	const nextThemes = {
		...themes,
		...themesOverride,
	};

	const value: Alf = {
		themes: nextThemes,
		themeName: themeName,
		theme: nextThemes[themeName],
		fonts: {
			scale: fontScale,
			scaleMultiplier: fontScaleMultiplier,
			family: fontFamily,
			setFontScale: setFontScaleAndPersist,
			setFontFamily: setFontFamilyAndPersist,
		},
		flags: {},
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAlf() {
	return useContext(Context);
}

export function useTheme(theme?: ThemeName) {
	const alf = useAlf();
	return theme ? alf.themes[theme] : alf.theme;
}
