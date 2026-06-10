import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// emoji-only messages from the other party sit in a borderless bubble; pull their bottom up by one `sm` step
// so the glyph bottom-aligns with the avatar instead of floating above its line-box baseline.
export const emojiBaselineNudge = style({ marginBottom: -space.sm });
