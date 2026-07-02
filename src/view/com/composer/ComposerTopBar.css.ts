import { style } from '@vanilla-extract/css';

// top-bar right slot: the publishing-stage label sitting beside the spinner.
export const publishingRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	paddingRight: 14,
	gap: 12,
});

// top-bar right slot: the drafts button + publish button cluster.
export const buttonRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
});
