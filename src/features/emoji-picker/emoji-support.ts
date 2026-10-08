import { emojiFontFamily } from '#/styles/tokens.css';

import { isSequence } from './dataset-codec';
import { VERSION_PROBES } from './probes';

/** known color emoji used as the baseline. */
const BASELINE = '\u{1F600}';
/** noncharacter used as a negative control. */
const NONCHARACTER = '\u{FFFF}';

/** canvas probe size. */
const PROBE_SIZE = 100;

/** maximum width ratio for one glyph. */
const SPLIT_RATIO = 1.8;

/** regional-indicator pair. */
const FLAG = '\u{1F1FA}\u{1F1F8}';
const FLAG_HALF = '\u{1F1FA}';
/** skin-tone sequence. */
const TONED_HAND = '\u{1F44B}\u{1F3FF}';

const REGIONAL_INDICATOR_FIRST = 0x1f1e6;
const REGIONAL_INDICATOR_LAST = 0x1f1ff;

/** detected emoji support. */
export type EmojiSupport = {
	/** whether tone modifiers render as one glyph. */
	skinTones: boolean;
	/**
	 * returns whether a glyph renders as one emoji.
	 *
	 * @param glyph default-tone glyph
	 * @param version Unicode emoji release that added the glyph
	 * @returns false when unsupported
	 */
	renders: (glyph: string, version: number) => boolean;
};

/** fail-open result. */
const UNKNOWN: EmojiSupport = { renders: () => true, skinTones: true };

/**
 * detects emoji support from canvas rendering.
 *
 * @returns detected support
 */
export function detectEmojiSupport(): EmojiSupport {
	const context = createProbeContext();
	if (!context) {
		return UNKNOWN;
	}

	// anti-fingerprinting can make color probes unreliable; require both controls.
	const colorUsable = isColorGlyph(context, BASELINE) && !isColorGlyph(context, NONCHARACTER);

	const unsupported = new Set<number>();
	if (colorUsable) {
		for (const { glyph, version } of VERSION_PROBES) {
			if (glyph !== null && !isColorGlyph(context, glyph)) {
				unsupported.add(version);
			}
		}
	}

	const baseline = context.measureText(BASELINE).width;
	const widthUsable = Number.isFinite(baseline) && baseline > 0;
	const fitsOneCell = (glyph: string) => context.measureText(glyph).width < baseline * SPLIT_RATIO;

	// check shaping before measuring individual flags; unshaped flags are narrow.
	const flags = !widthUsable || context.measureText(FLAG).width < context.measureText(FLAG_HALF).width * 2;
	const skinTones = !widthUsable || fitsOneCell(TONED_HAND);

	const renders = (glyph: string, version: number) => {
		if (unsupported.has(version)) {
			return false;
		}
		if (!widthUsable || !isSequence(glyph)) {
			return true;
		}
		// width alone cannot distinguish unshaped flags.
		if (isRegionalIndicatorPair(glyph) && !flags) {
			return false;
		}
		return fitsOneCell(glyph);
	};

	return { renders, skinTones };
}

function createProbeContext(): CanvasRenderingContext2D | null {
	try {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) {
			return null;
		}

		context.font = `${PROBE_SIZE}px ${emojiFontFamily}`;
		context.textBaseline = 'top';
		// scale the glyph into one pixel for a stable color sample.
		context.scale(1 / PROBE_SIZE, 1 / PROBE_SIZE);
		return context;
	} catch {
		return null;
	}
}

/** tests whether canvas renders a glyph in color. */
function isColorGlyph(context: CanvasRenderingContext2D, glyph: string): boolean {
	const black = sample(context, glyph, '#000');
	const white = sample(context, glyph, '#fff');
	// empty and black samples are indistinguishable here.
	if (!black[0] && !black[1] && !black[2]) {
		return false;
	}
	return black.every((channel, index) => channel === white[index]);
}

function sample(context: CanvasRenderingContext2D, glyph: string, color: string): Uint8ClampedArray {
	context.clearRect(0, 0, PROBE_SIZE, PROBE_SIZE);
	context.fillStyle = color;
	context.fillText(glyph, 0, 0);
	return context.getImageData(0, 0, 1, 1).data;
}

function isRegionalIndicatorPair(glyph: string): boolean {
	// oxlint-disable-next-line typescript/no-misused-spread -- iterate by Unicode code point
	const points = [...glyph];
	return points.length === 2 && points.every(isRegionalIndicator);
}

function isRegionalIndicator(char: string): boolean {
	const point = char.codePointAt(0);
	return point !== undefined && point >= REGIONAL_INDICATOR_FIRST && point <= REGIONAL_INDICATOR_LAST;
}
