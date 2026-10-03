export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn'] as const;
export const OTHER_SELF_LABELS = ['graphic-media'] as const;
const SELF_LABELS = [...ADULT_CONTENT_LABELS, ...OTHER_SELF_LABELS] as const;
export type SelfLabel = (typeof SELF_LABELS)[number];
export type AdultContentLabel = (typeof ADULT_CONTENT_LABELS)[number];

// default moderation severity: porn is hidden, sexual content warned, nudity shown.
const ADULT_SEVERITY: readonly AdultContentLabel[] = ['porn', 'sexual', 'nudity'];

/**
 * checks whether a value is a self-label the composer can apply.
 *
 * @param value the value to check
 * @returns whether it's a known self-label
 */
export const isSelfLabel = (value: string): value is SelfLabel => {
	return SELF_LABELS.some((label) => label === value);
};

/**
 * checks whether a value is an adult content self-label.
 *
 * @param value the value to check
 * @returns whether it's an adult content label
 */
export const isAdultContentLabel = (value: string | undefined): value is AdultContentLabel => {
	return ADULT_CONTENT_LABELS.some((label) => label === value);
};

/**
 * deduplicates labels, keeping only the most severe adult content label.
 *
 * @param labels labels to normalize
 * @returns the adult label, if any, followed by other labels in canonical order
 */
export const normalizeSelfLabels = (labels: readonly SelfLabel[]): SelfLabel[] => {
	const adult = ADULT_SEVERITY.find((label) => labels.includes(label));
	const others = OTHER_SELF_LABELS.filter((label) => labels.includes(label));
	return adult ? [adult, ...others] : others;
};

/**
 * compares duplicate-free label sets, ignoring order.
 *
 * @param a the first labels, without duplicates
 * @param b the second labels, without duplicates
 * @returns whether the sets are equal
 */
export const isSameSelfLabels = (a: readonly SelfLabel[], b: readonly SelfLabel[]): boolean => {
	return a.length === b.length && a.every((label) => b.includes(label));
};
