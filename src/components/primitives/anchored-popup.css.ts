import { createVar, fallbackVar, globalStyle, type GlobalStyleRule, style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

import type { Align, Side } from './anchored-popup';
import { topLayerReset } from './top-layer.css';

// popup styles use @starting-style for entry and [data-closed] for exit; presence waits for transitions.

// prevent nested popups from inheriting an ancestor's gap or padding.
const createLengthVar = (debugId: string) => {
	return createVar({ syntax: '<length>', inherits: false, initialValue: '0px' }, debugId);
};

/** gap between anchor and popup. */
export const sideOffsetVar = createLengthVar('sideOffset');

/** minimum distance from each viewport edge; unset edges are unpadded. */
export const collisionPaddingVars = {
	bottom: createLengthVar('collisionPaddingBottom'),
	left: createLengthVar('collisionPaddingLeft'),
	right: createLengthVar('collisionPaddingRight'),
	top: createLengthVar('collisionPaddingTop'),
} satisfies Record<Side, string>;

const viewportMaxWidth = `calc(100vw - ${collisionPaddingVars.left} - ${collisionPaddingVars.right})`;

// `data-side` and `data-align` set the popup's transform origin.
const basePositioner = style([
	topLayerReset,
	// keep intrinsic width so a narrow position-area triggers fallbacks instead of wrapping.
	// the reset layer lets consumers override sizing.
	layered(reset, {
		width: 'max-content',
		maxWidth: viewportMaxWidth,
	}),
	{
		containerType: 'anchored',
		positionVisibility: 'anchors-visible',
		overflow: 'visible',
		inset: 'auto',
	},
]);

/**
 * top-layer positioner for caller-supplied insets. `data-side` and `data-align` set the popup's transform
 * origin.
 */
export const manualPositioner = style([basePositioner]);

/** anchors by `data-side` and `data-align`, flipping or shifting to fit the viewport. */
export const autoPositioner = style([basePositioner]);

/** popup size limits supplied by `useAvailableSize`. */
export const availableSizeVars = {
	height: createVar('availableHeight'),
	width: createVar('availableWidth'),
};

/** applies `availableSizeVars` and lets scrollable content shrink. */
export const shrinkingPositioner = style([
	layered(reset, {
		maxWidth: fallbackVar(availableSizeVars.width, viewportMaxWidth),
		maxHeight: fallbackVar(availableSizeVars.height, 'none'),
	}),
	{
		display: 'flex',
		flexDirection: 'column',
	},
]);

// flex items otherwise retain their content's minimum height.
globalStyle(`${shrinkingPositioner} > *`, {
	minHeight: 0,
});

// #region placement
const OPPOSITE = {
	bottom: 'top',
	left: 'right',
	right: 'left',
	top: 'bottom',
} as const;

const MARGIN = {
	bottom: 'marginBottom',
	left: 'marginLeft',
	right: 'marginRight',
	top: 'marginTop',
} as const;

const isVertical = (side: Side): boolean => {
	return side === 'top' || side === 'bottom';
};

const getPositionArea = (side: Side, align: Align): string => {
	// a single side keyword permits shifting near viewport edges; spans align to the anchor's edges.
	switch (align) {
		case 'center': {
			return side;
		}
		case 'start': {
			return isVertical(side) ? `${side} span-x-end` : `${side} span-y-end`;
		}
		case 'end': {
			return isVertical(side) ? `${side} span-x-start` : `${side} span-y-start`;
		}
	}
};

// prefer aligned placements before allowing cross-axis shifting.
// Chrome for Android only tries the first five fallbacks.
const getFallbacks = (side: Side, align: Align): string[] => {
	const [sideFlip, alignFlip] = isVertical(side)
		? ['flip-block', 'flip-inline']
		: ['flip-inline', 'flip-block'];
	if (align === 'center') {
		return [sideFlip];
	}
	return [sideFlip, alignFlip, `${sideFlip} ${alignFlip}`, side, OPPOSITE[side]];
};

// fallback queries only style descendants, so --transform-origin is set on the popup, toward the anchor.
// browsers without anchored queries retain the preferred side's origin.
const setTransformOrigin = (selector: string, side: Side, cross: string): void => {
	const toOrigin = (edge: Side): string => {
		return isVertical(side) ? `${cross} ${edge}` : `${edge} ${cross}`;
	};

	globalStyle(selector, {
		vars: { '--transform-origin': toOrigin(OPPOSITE[side]) },
		'@container': {
			[`anchored(fallback: ${isVertical(side) ? 'flip-block' : 'flip-inline'})`]: {
				vars: { '--transform-origin': toOrigin(side) },
			},
		},
	});
};

{
	const sides: Side[] = ['top', 'bottom', 'left', 'right'];
	const aligns: Align[] = ['center', 'start', 'end'];

	for (const side of sides) {
		const [start, end]: [Side, Side] = isVertical(side) ? ['left', 'right'] : ['top', 'bottom'];

		for (const align of aligns) {
			const attributes = `[data-side='${side}'][data-align='${align}']`;

			const rule: GlobalStyleRule = {
				positionArea: getPositionArea(side, align),
				positionTryFallbacks: getFallbacks(side, align).join(', '),
				[MARGIN[OPPOSITE[side]]]: sideOffsetVar,
			};

			const edges: Side[] = [side];
			// padding the anchor-aligned edge would shift the alignment.
			if (align !== 'end') {
				edges.push(end);
			}
			if (align !== 'start') {
				edges.push(start);
			}
			// margins provide collision padding and flip with the placement.
			for (const edge of edges) {
				rule[MARGIN[edge]] = collisionPaddingVars[edge];
			}

			globalStyle(`${autoPositioner}${attributes}`, rule);

			const originSelector = `${basePositioner}${attributes} > *`;
			if (align === 'center') {
				setTransformOrigin(originSelector, side, 'center');
			} else {
				const cross = align === 'start' ? start : end;
				setTransformOrigin(originSelector, side, cross);
				// x-axis start/end spans reverse in RTL.
				if (isVertical(side)) {
					setTransformOrigin(`${originSelector}:dir(rtl)`, side, OPPOSITE[cross]);
				}
			}
		}
	}
}
// #endregion
