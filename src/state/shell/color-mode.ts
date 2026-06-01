import { device, useStorage } from '#/storage';

export function useThemePrefs() {
	const [colorMode = 'system'] = useStorage(device, ['colorMode']);
	const [darkTheme = 'dim'] = useStorage(device, ['darkTheme']);

	return { colorMode, darkTheme };
}

export function useSetThemePrefs() {
	const [, setColorMode] = useStorage(device, ['colorMode']);
	const [, setDarkTheme] = useStorage(device, ['darkTheme']);

	return { setColorMode, setDarkTheme };
}
