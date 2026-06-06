import { sprinkles } from '#/styles/sprinkles.css';

export const groupBody = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'sm', width: 'full' });
export const headerRow = sprinkles({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 'sm',
});
// inset the rows to align under the title text, past the header icon (24px) + gap (8px)
export const insetColumn = sprinkles({
	display: 'flex',
	flexDirection: 'column',
	gap: 'sm',
	paddingLeft: '_4xl',
});
