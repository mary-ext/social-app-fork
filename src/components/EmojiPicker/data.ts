import { queryOptions } from '@tanstack/react-query';

import { GCTIME, STALE } from '#/state/queries';

import type { SkinTone } from '#/storage/schema';

import { RECORD, titleCase } from './dataset-codec';
import { detectEmojiSupport, type EmojiSupport } from './emoji-support';
import { buildHaystacks, searchHaystacks } from './search';
import { applySkinTone } from './skin-tone';

// load the payloads as assets rather than bundling them.
const RENDER_URL = new URL('./dataset/render.json', import.meta.url);
const KEYWORDS_URL = new URL('./dataset/keywords.json', import.meta.url);

type RenderColumns = {
	ids: string;
	modifierBases: string;
	names: string;
	natives: string;
	sections: string;
	toneOverrides: string;
	tones: string;
	versionList: string;
	versions: string;
};

type SearchColumns = {
	emoticons: string;
	keywords: string;
};

/** a picker section and its indices. */
export type EmojiDatasetSection = {
	indices: number[];
	key: string;
};

/** decoded emoji data. */
export type EmojiDataset = {
	ids: string[];
	indexById: ReadonlyMap<string, number>;
	names: string[];
	natives: string[];
	sections: EmojiDatasetSection[];
	/** whether tone modifiers are supported. */
	skinTones: boolean;
	/**
	 * returns an emoji glyph at the given skin tone.
	 *
	 * @param index emoji index
	 * @param tone skin tone
	 * @returns the glyph
	 */
	nativeAt: (index: number, tone: SkinTone) => string;
};

/** searches the dataset. */
export type EmojiSearch = (query: string, limit?: number) => number[];

/**
 * returns query options for the emoji dataset.
 *
 * @returns emoji dataset query options
 */
export function emojiDatasetQuery() {
	return queryOptions({
		gcTime: GCTIME.MINUTES.FIVE,
		queryFn: async ({ signal }) => {
			const columns = fetchColumns<RenderColumns>(RENDER_URL, signal);
			// probe while the payload request is in flight.
			const support = detectEmojiSupport();
			return decodeDataset(await columns, support);
		},
		queryKey: ['emoji-dataset'],
		staleTime: STALE.INFINITY,
	});
}

/**
 * returns query options for the emoji search index.
 *
 * @returns emoji search query options
 */
export function emojiSearchQuery() {
	return queryOptions({
		gcTime: GCTIME.MINUTES.FIVE,
		queryFn: async ({ client, signal }) => {
			const columnsPromise = fetchColumns<SearchColumns>(KEYWORDS_URL, signal);
			const { ids, indexById, names } = await client.ensureQueryData(emojiDatasetQuery());
			const columns = await columnsPromise;

			const haystacks = buildHaystacks({
				emoticons: columns.emoticons.split(RECORD),
				ids,
				keywords: columns.keywords.split(RECORD),
				names,
				shown: (index) => indexById.has(ids[index]!),
			});

			const search: EmojiSearch = (query, limit = 90) => searchHaystacks({ haystacks, ids, limit, query });
			return search;
		},
		queryKey: ['emoji-search'],
		staleTime: STALE.INFINITY,
	});
}

async function fetchColumns<T>(url: URL, signal: AbortSignal): Promise<T> {
	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(`emoji dataset request failed: ${response.status}`);
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- payload is generated and content-hashed
	return (await response.json()) as T;
}

function decodeDataset(columns: RenderColumns, support: EmojiSupport): EmojiDataset {
	const ids = columns.ids.split(RECORD);
	const { renders, skinTones } = support;
	const natives = columns.natives.split(RECORD);
	const tones = columns.tones;
	const modifierBases = new Set(columns.modifierBases.split(',').map((hex) => Number.parseInt(hex, 16)));
	const names = columns.names.split(RECORD).map((name, index) => name || titleCase(ids[index]!));

	const versionList = columns.versionList.split(',').map(Number);
	const versionAt = (index: number) => versionList[Number.parseInt(columns.versions[index]!, 36)]!;

	const toneOverrides = new Map<number, string[]>();
	for (const entry of columns.toneOverrides ? columns.toneOverrides.split(',') : []) {
		const [index, glyphs] = entry.split(':');
		toneOverrides.set(Number.parseInt(index!, 36), glyphs!.split(' '));
	}

	const indexById = new Map<string, number>();
	const sections: EmojiDatasetSection[] = [];

	let index = 0;
	for (const spec of columns.sections.split(',')) {
		const [key, count] = spec.split(':');
		const indices: number[] = [];
		for (const end = index + Number(count); index < end; index++) {
			if (renders(natives[index]!, versionAt(index))) {
				indices.push(index);
				indexById.set(ids[index]!, index);
			}
		}
		sections.push({ indices, key: key! });
	}

	const nativeAt = (at: number, tone: SkinTone) => {
		if (tone === 1 || !skinTones || tones[at] !== '1') {
			return natives[at]!;
		}
		return toneOverrides.get(at)?.[tone - 2] ?? applySkinTone(natives[at]!, tone, modifierBases);
	};

	return { ids, indexById, names, nativeAt, natives, sections, skinTones };
}
