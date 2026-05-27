// scaffold: echoes input back as the translation. inline at the single caller
// (src/lib/translation/types.ts) once native on-device translation is removed from the web bundle.

export type TranslationTaskResult = {
	translatedTexts: string | string[];
	sourceLanguage?: string | null;
	targetLanguage: string;
};

export async function onTranslateTask({
	input,
	targetLangCode,
	sourceLangCode,
}: {
	input: string;
	targetLangCode: string;
	sourceLangCode?: string;
}): Promise<TranslationTaskResult> {
	return {
		translatedTexts: input,
		sourceLanguage: sourceLangCode,
		targetLanguage: targetLangCode,
	};
}
