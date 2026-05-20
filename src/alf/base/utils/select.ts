import { type ThemeName } from '../themes';

export function select<T>(
	name: ThemeName,
	options:
		| (Record<ThemeName, T> & { default?: undefined })
		| (Partial<Record<ThemeName, T>> & { default: T }),
): T {
	switch (name) {
		case 'light':
			return options.light as T;
		case 'dark':
			return options.dark as T;
		case 'dim':
			return options.dim as T;
		default:
			return options.default as T;
	}
}
