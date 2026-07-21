import type { ThemeName } from '../themes';

export function select<T>(
	name: ThemeName,
	options:
		| (Record<ThemeName, T> & { default?: undefined })
		| (Partial<Record<ThemeName, T>> & { default: T }),
): T {
	const selected = options[name];
	if (selected !== undefined) {
		return selected;
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the union arm with a missing key requires `default` to be a `T`
	return options.default as T;
}
