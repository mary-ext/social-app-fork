import { clamp } from '#/lib/utils/numbers';

export type VideoProgressPhase =
	| 'compressing'
	| 'rendering'
	| 'uploading'
	| 'uploadingWithoutCompression'
	| 'processing';

const PHASE_RANGES: Record<VideoProgressPhase, [start: number, end: number]> = {
	compressing: [0, 0.375],
	rendering: [0, 0.375],
	uploading: [0.375, 0.75],
	uploadingWithoutCompression: [0, 0.75],
	processing: [0.75, 1],
};

function videoProgressForPhase(phase: VideoProgressPhase, phaseProgress: number): number {
	const [start, end] = PHASE_RANGES[phase];
	return start + (end - start) * clamp(phaseProgress, 0, 1);
}

/**
 * advances overall video progress without allowing regressions.
 *
 * @param currentProgress current overall progress
 * @param phase reported phase
 * @param phaseProgress reported phase progress
 * @returns overall progress from 0 to 1
 */
export function advanceVideoProgress(
	currentProgress: number,
	phase: VideoProgressPhase,
	phaseProgress: number,
): number {
	return Math.max(currentProgress, videoProgressForPhase(phase, phaseProgress));
}
