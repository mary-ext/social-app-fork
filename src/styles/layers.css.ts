import { type StyleRule, layer } from '@vanilla-extract/css';

export const reset = layer();

export const components = layer();

export const layered = (name: string, rule: StyleRule): StyleRule => ({ '@layer': { [name]: rule } });
