import { gifKlipyFeaturedUrl, gifKlipySearchUrl } from '#/lib/constants/services';
import type { Gif } from '#/lib/media/external-gif/types';

import { deviceLocales } from '#/locale/deviceLocales';

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `Input` types the returned function, so callers supply it explicitly (see `searchGifs`)
const createKlipyApi = <Input extends object>(
	urlFn: (params: string) => string,
): ((
	input: Input & { pos?: string },
	signal: AbortSignal,
) => Promise<{
	next: string;
	results: Gif[];
}>) => {
	return async (input, signal) => {
		const params = new URLSearchParams();

		params.set('client_key', 'bluesky-web');

		// 30 is divisible by 2 and 3, so both 2 and 3 column layouts can be used
		params.set('limit', '30');

		params.set('contentfilter', 'low'); // PG-13 equivalent

		const locale = deviceLocales[0];

		if (locale?.regionCode) {
			params.set('locale', locale.regionCode.toLowerCase());
		}

		for (const [key, value] of Object.entries(input)) {
			if (value !== undefined) {
				// oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `Object.entries` widens to `any`; coercing arbitrary input values is deliberate
				params.set(key, String(value));
			}
		}

		const res = await fetch(urlFn(params.toString()), {
			signal,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch KLIPY API (status ${res.status})`);
		}
		const body: { next: string; results: Gif[] } = await res.json();
		return {
			next: body.next,
			results: body.results,
		};
	};
};

export const getTrendingGifs = createKlipyApi(gifKlipyFeaturedUrl);
export const searchGifs = createKlipyApi<{ q: string }>(gifKlipySearchUrl);
