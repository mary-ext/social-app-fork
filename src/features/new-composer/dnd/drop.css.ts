import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

import { POST_GAP_CENTER } from '../layout';

/** drop-target tint for a post's pseudo-element. */
export const DROP_TINT = {
	position: 'absolute',
	// center the edges in the gaps between posts.
	inset: `-${POST_GAP_CENTER}px ${space.sm}px ${POST_GAP_CENTER}px`,
	borderRadius: borderRadius.md,
	boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${vars.palette.primary_500} 40%, transparent)`,
	backgroundColor: `color-mix(in srgb, ${vars.palette.primary_500} 6%, transparent)`,
	pointerEvents: 'none',
	content: '""',
} as const;
