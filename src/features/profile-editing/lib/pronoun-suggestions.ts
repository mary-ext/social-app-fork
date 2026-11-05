// suggestions are full "subject/object" forms like "she/her". one pick fills in the full form; several picks
// combine their subject forms in pick order, e.g. "she/they".

const subjectOf = (suggestion: string): string => {
	return suggestion.split('/')[0]!.trim();
};

const normalize = (text: string): string => {
	return text.trim().toLocaleLowerCase();
};

/**
 * @param value the pronouns text
 * @param suggestions the suggested "subject/object" forms
 * @returns indexes into `suggestions` that make up `value`, in the order they appear, or null if `value` has
 *   anything the suggestions don't cover
 */
export const parsePronouns = (value: string, suggestions: string[]): number[] | null => {
	const text = normalize(value);
	if (!text) {
		return [];
	}

	const full = suggestions.findIndex((s) => normalize(s) === text);
	if (full !== -1) {
		return [full];
	}

	const subjects = suggestions.map((s) => normalize(subjectOf(s)));
	const indexes: number[] = [];
	for (const part of text.split('/')) {
		const index = subjects.indexOf(part.trim());
		if (index === -1 || indexes.includes(index)) {
			return null;
		}
		indexes.push(index);
	}
	return indexes.length > 1 ? indexes : null;
};

const composePronouns = (indexes: number[], suggestions: string[]): string => {
	if (indexes.length === 0) {
		return '';
	}
	if (indexes.length === 1) {
		return suggestions[indexes[0]!]!;
	}
	return indexes.map((i) => subjectOf(suggestions[i]!)).join('/');
};

/**
 * toggles a suggestion in the pronouns text. tapping a picked suggestion removes it, and tapping one while
 * `value` holds custom text replaces that text.
 *
 * @param value the current pronouns text
 * @param index the tapped suggestion's index
 * @param suggestions the suggested "subject/object" forms
 * @returns the new pronouns text
 */
export const togglePronoun = (value: string, index: number, suggestions: string[]): string => {
	const picked = parsePronouns(value, suggestions);
	if (!picked) {
		return composePronouns([index], suggestions);
	}
	const next = picked.includes(index) ? picked.filter((i) => i !== index) : [...picked, index];
	return composePronouns(next, suggestions);
};
