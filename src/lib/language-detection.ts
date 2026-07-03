import { detect, type Detection, initialize } from '@oomfware/lang-detect';

export type { Detection } from '@oomfware/lang-detect';

type State = 'idle' | 'loading' | 'ready';

let state: State = 'idle';
let loadPromise: Promise<void> | undefined;

/**
 * loads the language-detection model weights. repeated calls share a single in-flight load, and a failed load
 * resets to allow retrying.
 *
 * @returns promise that resolves when weights are ready or when a load attempt fails.
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
 * detects the languages present in `text`, sorted by probability descending. returns an empty array if
 * weights are not yet loaded or if the language is undetermined.
 *
 * @param text text to analyze
 * @returns probability-sorted detections, or an empty array
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

/**
 * detects the languages present in `text`, waiting for the weights to load first.
 *
 * @param text text to analyze
 * @returns probability-sorted detections, or an empty array when detection is undetermined or weights failed
 *   to load
 */
export const detectLanguagesAsync = async (text: string): Promise<Detection[]> => {
	await initializeLanguageDetection();
	return state === 'ready' ? detect(text) : [];
};
