import type { AnyProfileView } from '@atcute/bluesky';

import type { CompletionType } from '#/lib/rich-text-input';

export type AutocompleteProfile = {
	type: 'profile';
	key: string;
	value: string;
	profile: AnyProfileView;
};

export type AutocompleteTag = {
	type: 'tag';
	key: string;
	value: string;
	tag: string;
};

export type AutocompleteEmoji = {
	type: 'emoji';
	key: string;
	value: string;
	label: string;
};

export type AutocompleteSearch = {
	type: 'search';
	key: string;
	value: string;
};

export type AutocompleteItem = AutocompleteProfile | AutocompleteTag | AutocompleteEmoji | AutocompleteSearch;

export type AutocompleteItemType = AutocompleteItem['type'];

export type AutocompleteApi = {
	query: string;
	items: AutocompleteItem[];
	/** fetching the current query; items may still be from the previous query. */
	isFetching: boolean;
};

/**
 * maps a completion trigger to its suggestion type.
 *
 * @param type the completion's trigger type
 * @returns the autocomplete item type to query
 */
export function parseAutocompleteItemType(type: CompletionType): AutocompleteItemType {
	switch (type) {
		case 'mention': {
			return 'profile';
		}
		case 'tag': {
			return 'tag';
		}
		case 'emoji': {
			return 'emoji';
		}
	}
}
