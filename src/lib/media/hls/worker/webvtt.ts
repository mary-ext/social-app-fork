import type { SubtitleCue } from '../shared/protocol';
import { MPEG_TS_TIMESCALE } from './mpeg-ts';

const BLANK_LINE = /\r?\n\r?\n/;

const ALIGNMENTS = ['start', 'center', 'end', 'left', 'right'] as const;

const parseTimestamp = (stamp: string) =>
	stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);

const readTimestampMap = (block: string) => {
	const header = /X-TIMESTAMP-MAP=(.*)/.exec(block);
	if (!header) {
		return null;
	}
	let mpegts = 0;
	let local = 0;

	for (const field of header[1]!.split(',')) {
		const separator = field.indexOf(':');
		const name = field.slice(0, separator).trim();
		const value = field.slice(separator + 1).trim();

		switch (name) {
			case 'MPEGTS': {
				mpegts = Number(value) / MPEG_TS_TIMESCALE;
				break;
			}
			case 'LOCAL': {
				local = parseTimestamp(value);
				break;
			}
		}
	}

	return mpegts - local;
};

const parsePercentage = (value: string) => Number(value.endsWith('%') ? value.slice(0, -1) : value);

const applySetting = (cue: SubtitleCue, setting: string) => {
	const separator = setting.indexOf(':');
	const value = setting.slice(separator + 1);

	switch (setting.slice(0, separator)) {
		case 'align': {
			const alignment = ALIGNMENTS.find((candidate) => candidate === value);
			if (alignment) {
				cue.align = alignment;
			}
			break;
		}
		case 'position': {
			cue.position = parsePercentage(value);
			break;
		}
		case 'size': {
			cue.size = parsePercentage(value);
			break;
		}
	}
};

const parseCues = (blocks: string[], offset: number) => {
	const cues: SubtitleCue[] = [];

	for (const block of blocks) {
		const lines = block.split(/\r?\n/).filter((line) => line.length > 0);
		const timing = lines.findIndex((line) => line.includes('-->'));
		if (timing < 0) {
			continue;
		}
		const [start, , end, ...settings] = lines[timing]!.trim().split(/\s+/);
		const text = lines.slice(timing + 1).join('\n');
		if (!start || !end || text.length === 0) {
			continue;
		}
		const cue: SubtitleCue = {
			start: parseTimestamp(start) + offset,
			end: parseTimestamp(end) + offset,
			text,
		};

		for (const setting of settings) {
			applySetting(cue, setting);
		}

		cues.push(cue);
	}

	return cues;
};

/**
 * parses one WebVTT segment.
 *
 * @param document segment text
 * @param anchor timestamp-map offset from the first segment
 * @returns timestamp-map anchor and parsed cues
 */
export const parseWebVtt = (
	document: string,
	anchor: number | undefined,
): { anchor: number; cues: SubtitleCue[] } => {
	const blocks = document.split(BLANK_LINE);
	const map = readTimestampMap(blocks[0] ?? '');
	const base = anchor ?? map ?? 0;

	return { anchor: base, cues: parseCues(blocks, (map ?? base) - base) };
};
