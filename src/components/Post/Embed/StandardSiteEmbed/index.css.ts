import { style } from '@vanilla-extract/css';

import { borderRadius } from '#/styles/tokens.css';

// unlayered, so it outranks the avatar root's layered `border-radius`, which the inner layers inherit.
export const publicationAvatar = style({ borderRadius: borderRadius.sm });
