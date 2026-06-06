import { sprinkles } from '#/styles/sprinkles.css';

export const body = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'sm', width: 'full' });
export const headerRow = sprinkles({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 'sm',
});
export const inset = sprinkles({ paddingLeft: '_4xl' });
