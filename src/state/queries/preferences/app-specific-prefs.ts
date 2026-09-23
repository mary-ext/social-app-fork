import * as v from '@atcute/lexicons/validations';

/** uses an `app.bsky` prefix because the PDS discards preferences outside that namespace. */
export const APP_SPECIFIC_PREF_TYPE = 'app.bsky.unspecced.thirdparty#kelinciPrefs';

/** account-synced app settings */
export const appSpecificPrefsSchema = v.object({
	$type: v.literal(APP_SPECIFIC_PREF_TYPE),
});

export type AppSpecificPrefs = v.InferOutput<typeof appSpecificPrefsSchema>;

export const DEFAULT_APP_SPECIFIC_PREF: AppSpecificPrefs = {
	$type: APP_SPECIFIC_PREF_TYPE,
};

/**
 * reads the app preference entry.
 *
 * @param prefs the raw preferences array
 * @returns the validated entry, or defaults if absent or invalid
 */
export const readAppSpecificPref = (prefs: readonly { $type: string }[]): AppSpecificPrefs => {
	const raw = prefs.findLast((pref) => pref.$type === APP_SPECIFIC_PREF_TYPE);
	if (!raw) {
		return DEFAULT_APP_SPECIFIC_PREF;
	}

	const result = v.safeParse(appSpecificPrefsSchema, raw);
	return result.ok ? result.value : DEFAULT_APP_SPECIFIC_PREF;
};
