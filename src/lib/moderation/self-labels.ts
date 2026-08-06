export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn'] as const;
export const OTHER_SELF_LABELS = ['graphic-media'] as const;
const SELF_LABELS = [...ADULT_CONTENT_LABELS, ...OTHER_SELF_LABELS] as const;
export type SelfLabel = (typeof SELF_LABELS)[number];
