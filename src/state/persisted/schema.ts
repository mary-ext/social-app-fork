import { z } from 'zod';

import { logger } from '#/logger';

import { deviceLanguageCodes } from '#/locale/deviceLocales';
import { AppLanguage } from '#/locale/languages';

const schema = z.object({
	colorMode: z.enum(['system', 'light', 'dark']),
	darkTheme: z.enum(['dim', 'dark']).optional(),
	reminders: z.object({
		lastEmailConfirm: z.string().optional(),
	}),
	languagePrefs: z.object({
		/**
		 * The target language for translating posts.
		 *
		 * BCP-47 2-letter language code without region.
		 */
		primaryLanguage: z.string(),
		/**
		 * The languages the user can read, passed to feeds.
		 *
		 * BCP-47 2-letter language codes without region.
		 */
		contentLanguages: z.array(z.string()),
		/**
		 * The language(s) the user is currently posting in, configured within the composer. Multiple languages
		 * are separated by commas.
		 *
		 * BCP-47 2-letter language code without region.
		 */
		postLanguage: z.string(),
		/**
		 * The user's post language history, used to pre-populate the post language selector in the composer.
		 * Within each value, multiple languages are separated by commas.
		 *
		 * BCP-47 2-letter language codes without region.
		 */
		postLanguageHistory: z.array(z.string()),
		/**
		 * The language for UI translations in the app.
		 *
		 * BCP-47 2-letter language code with or without region, to match with {@link AppLanguage}.
		 */
		appLanguage: z.string(),
	}),
	invites: z.object({
		copiedInvites: z.array(z.string()),
	}),
	pdsAddressHistory: z.array(z.string()).optional(),
	disableHaptics: z.boolean().optional(),
});
export type Schema = z.infer<typeof schema>;

export const defaults: Schema = {
	colorMode: 'system',
	darkTheme: 'dim',
	reminders: {
		lastEmailConfirm: undefined,
	},
	languagePrefs: {
		primaryLanguage: deviceLanguageCodes[0] || 'en',
		contentLanguages: deviceLanguageCodes || [],
		postLanguage: deviceLanguageCodes[0] || 'en',
		postLanguageHistory: (deviceLanguageCodes || []).concat(['en', 'ja', 'pt', 'de']).slice(0, 6),
		appLanguage: AppLanguage.en,
	},
	invites: {
		copiedInvites: [],
	},
	pdsAddressHistory: [],
	disableHaptics: false,
};

export function tryParse(rawData: string): Schema | undefined {
	let objData;
	try {
		objData = JSON.parse(rawData);
	} catch (e) {
		logger.error('persisted state: failed to parse root state from storage', {
			message: e,
		});
	}
	if (!objData) {
		return undefined;
	}
	const parsed = schema.safeParse(objData);
	if (parsed.success) {
		return objData;
	} else {
		const errors =
			parsed.error?.errors?.map((e) => ({
				code: e.code,
				// @ts-ignore exists on some types
				expected: e?.expected,
				path: e.path?.join('.'),
			})) || [];
		logger.error(`persisted store: data failed validation on read`, { errors });
		return undefined;
	}
}

export function tryStringify(value: Schema): string | undefined {
	try {
		schema.parse(value);
		return JSON.stringify(value);
	} catch (e) {
		logger.error(`persisted state: failed stringifying root state`, {
			message: e,
		});
		return undefined;
	}
}
