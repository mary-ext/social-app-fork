import type { AppBskyLabelerDefs } from '@atcute/bluesky';

import type {
	ReportCategoryConfig,
	ReportOption,
} from '#/components/moderation/ReportDialog/utils/useReportOptions';

export type ReportState = {
	category?: ReportCategoryConfig;
	/** Free-text context; always a string so the character counter can read its length unconditionally. */
	details: string;
	error?: string;
	/** Caller-overridden moderation service; when unset the form defaults to the first supported labeler. */
	labeler?: AppBskyLabelerDefs.LabelerViewDetailed;
	reason?: ReportOption;
};

/** Which screen the current state maps to: pick a category, pick a reason within it, then the submit form. */
export type ReportStep = 'categories' | 'form' | 'reasons';

export type ReportAction =
	| { type: 'clearCategory' }
	| { type: 'clearError' }
	| { type: 'clearReason' }
	| { category: ReportCategoryConfig; otherOption: ReportOption; type: 'selectCategory' }
	| { labeler: AppBskyLabelerDefs.LabelerViewDetailed; type: 'selectLabeler' }
	| { reason: ReportOption; type: 'selectReason' }
	| { details: string; type: 'setDetails' }
	| { error: string; type: 'setError' };

export const initialState: ReportState = {
	details: '',
};

/**
 * Maps a state to its visible step. The `other` category has a single implicit reason and is committed
 * straight to the form by {@link reducer}, so a category without a reason always means the reason list.
 */
export function stepFor(state: ReportState): ReportStep {
	if (!state.category) {
		return 'categories';
	}
	if (!state.reason) {
		return 'reasons';
	}
	return 'form';
}

export function reducer(state: ReportState, action: ReportAction): ReportState {
	switch (action.type) {
		case 'clearCategory':
			return { ...state, category: undefined, labeler: undefined, reason: undefined };
		case 'clearError':
			return { ...state, error: undefined };
		case 'clearReason':
			return { ...state, labeler: undefined, reason: undefined };
		case 'selectCategory': {
			// `other` has no reason list of its own — commit its single reason and land on the form.
			const isOther = action.category.key === 'other';
			return {
				...state,
				category: action.category,
				labeler: undefined,
				reason: isOther ? action.otherOption : undefined,
			};
		}
		case 'selectLabeler':
			return { ...state, labeler: action.labeler };
		case 'selectReason':
			return { ...state, labeler: undefined, reason: action.reason };
		case 'setDetails':
			return { ...state, details: action.details };
		case 'setError':
			return { ...state, error: action.error };
	}
}
