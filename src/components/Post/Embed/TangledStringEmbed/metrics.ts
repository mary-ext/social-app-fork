import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, space } from '#/styles/tokens.css';

export const codeTextSize = 'md_sub';

export const codeLineHeight = roundToPx(`calc(${fontSize[codeTextSize]} * ${fontLeading[codeTextSize]})`);

export const codePaddingBlock = space.sm;

export const previewRows = 10;

export const previewHeight = `calc(${codeLineHeight} * ${previewRows} + ${codePaddingBlock * 2}px)`;
