// scaffold: returns 'en' for any non-empty input. inline at the single caller
// (src/view/com/composer/select-language/SuggestedLanguage.tsx) once SuggestedLanguage goes away
// with the English-only catalog sweep.

export type LanguageResult = {
	language: string;
	confidence: number;
};

export function guessLanguage(text: string): string | undefined {
	const normalized = text.trim();
	if (!normalized) return undefined;
	return 'en';
}

export async function guessLanguageAsync(text: string): Promise<LanguageResult[]> {
	const language = guessLanguage(text);
	return language ? [{ language, confidence: 1 }] : [];
}
