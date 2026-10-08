/** state attributes for styling primitive parts. */
export type DataAttributes = { [K in `data-${string}`]?: string };

/**
 * converts state to `data-*` attributes. `true` becomes an empty string; strings are preserved; `false` and
 * `undefined` are omitted.
 *
 * @param state unprefixed attribute names and values
 * @returns state attributes
 */
export const dataAttributes = (state: Record<string, boolean | string | undefined>): DataAttributes => {
	const attributes: DataAttributes = {};
	for (const [name, value] of Object.entries(state)) {
		if (value === true) {
			attributes[`data-${name}`] = '';
		} else if (typeof value === 'string') {
			attributes[`data-${name}`] = value;
		}
	}
	return attributes;
};
