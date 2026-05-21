import { detect, type Detection, initialize } from '@oomfware/lang-detect';

type State = 'idle' | 'loading' | 'ready';

let state: State = 'idle';
let loadPromise: Promise<void> | undefined;

/**
 * Loads the language-detection model weights. Idempotent — repeated calls share a single in-flight load, and
 * a failed load resets so a later call can retry.
 *
 * Weights (~27 kB) are fetched lazily to keep them out of the initial bundle, so callers should kick this off
 * early to have detection ready by first use.
 *
 * @returns a promise that resolves once weights are ready, or once a load attempt has failed
 */
export const initializeLanguageDetection = (): Promise<void> => {
	if (!loadPromise) {
		state = 'loading';
		loadPromise = initialize().then(
			() => {
				state = 'ready';
			},
			() => {
				state = 'idle';
				loadPromise = undefined;
			},
		);
	}
	return loadPromise;
};

/**
 * Detects the languages present in `text`, sorted by probability descending.
 *
 * Detection is synchronous but depends on lazily-loaded weights: the first call triggers loading and returns
 * an empty array, as does any call before loading completes. Callers must treat an empty result as
 * "undetermined".
 *
 * @param text text to analyze
 * @returns probability-sorted detections, or an empty array when weights are not yet loaded
 */
export const detectLanguages = (text: string): Detection[] => {
	if (state === 'ready') {
		return detect(text);
	}
	if (state === 'idle') {
		void initializeLanguageDetection();
	}
	return [];
};
