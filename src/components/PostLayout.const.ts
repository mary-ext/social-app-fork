// sourced from the vanilla-extract token scale (not the `#/alf` barrel) so this module stays safe to import
// from `*.css.ts`, which the VE loader evaluates in Node at build time where the barrel's `window` access throws
import { space } from '#/styles/tokens.css';

/** Horizontal page gutter shared by every post surface (feed, thread, anchor). */
export const OUTER_SPACE = space.lg;

/** Thickness of every reply-spine / indent-guide line. */
export const REPLY_LINE_WIDTH = 2;
