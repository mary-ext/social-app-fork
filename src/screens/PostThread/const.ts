// sourced from the vanilla-extract token scale (not the `#/alf` barrel) so this module stays safe to import
// from `*.css.ts`, which the VE loader evaluates in Node at build time where the barrel's `window` access throws
import { space } from '#/styles/tokens.css';

export const TREE_INDENT = space.lg;
export const TREE_AVI_WIDTH = 24;
export const LINEAR_AVI_WIDTH = 36;
export const REPLY_LINE_WIDTH = 2;
export const OUTER_SPACE = space.lg;
