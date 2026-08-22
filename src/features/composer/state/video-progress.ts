import { clamp } from '#/lib/utils/numbers';

export type VideoProgressPhase = 'uploading' | 'processing';

// processing progress covers the full server-side job, so reserve the second half for it.
const PHASE_RANGES: Record<VideoProgressPhase, [start: number, end: number]> = {
	uploading: [0, 0.5],
	processing: [0.5, 1],
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
