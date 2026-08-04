import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { isSequence, RECORD, titleCase } from '../src/components/EmojiPicker/dataset-codec.ts';
import { VERSION_PROBES } from '../src/components/EmojiPicker/probes.ts';
import { applySkinTone, SKIN_TONE_MODIFIERS } from '../src/components/EmojiPicker/skin-tone.ts';

const require = createRequire(import.meta.url);

/** maps source groups to picker sections. */
const SECTION_FOR_GROUP = new Map([
	[0, 'people'],
	[1, 'people'],
	[3, 'nature'],
	[4, 'foods'],
	[5, 'places'],
	[6, 'activity'],
	[7, 'objects'],
	[8, 'symbols'],
	[9, 'flags'],
]);

/** payload order; must match `CATEGORIES`. */
const SECTIONS = ['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'];

const OUT_DIR = './src/components/EmojiPicker/dataset';

type Skin = { emoji: string; tone: number | number[] };
type Source = {
	emoji: string;
	emoticon?: string | string[];
	group?: number;
	hexcode: string;
	label: string;
	order?: number;
	skins?: Skin[];
	tags?: string[];
	/** 1 for emoji presentation, 0 for text. */
	type: 0 | 1;
	version: number;
};

type Shortcodes = Record<string, string | string[]>;

const source: Source[] = require('emojibase-data/en/data.json');
const shortcodes: Shortcodes = require('emojibase-data/en/shortcodes/emojibase.json');

// #region collect

const modifierBases = new Set<number>();
for (const emoji of source) {
	for (const skin of emoji.skins ?? []) {
		// oxlint-disable-next-line typescript/no-misused-spread -- iterate by Unicode code point
		const points = [...skin.emoji].map((char) => char.codePointAt(0)!);
		for (let i = 1; i < points.length; i++) {
			if (SKIN_TONE_MODIFIERS.includes(points[i]!)) {
				modifierBases.add(points[i - 1]!);
			}
		}
	}
}

type Entry = {
	emoticons: string[];
	id: string;
	keywords: string[];
	name: string;
	native: string;
	section: string;
	sortOrder: number;
	/** tone variants not derivable from modifiers. */
	toneOverrides: string[];
	toned: boolean;
	version: number;
};

const entries: Entry[] = [];
const seenIds = new Set<string>();

for (const emoji of source) {
	const section = emoji.group !== undefined ? SECTION_FOR_GROUP.get(emoji.group) : undefined;
	if (!section) {
		continue;
	}

	const codes = shortcodes[emoji.hexcode];
	const ids = codes === undefined ? [] : Array.isArray(codes) ? codes : [codes];
	if (!ids.length) {
		continue;
	}

	const id = ids[0]!;
	if (seenIds.has(id)) {
		throw new Error(`duplicate shortcode "${id}" (${emoji.hexcode})`);
	}
	seenIds.add(id);

	const name = titleCase(emoji.label.replace(/[\s:]+/g, '_'));

	// omit terms covered by the id or name.
	const covered = new Set([...id.split('_'), ...name.toLowerCase().split(/\s+/)]);
	const keywords = [...new Set([...ids.slice(1).flatMap((code) => code.split('_')), ...(emoji.tags ?? [])])]
		.flatMap((tag) => tag.toLowerCase().split(/\s+/))
		.filter((tag) => tag && !covered.has(tag));

	const tones = (emoji.skins ?? [])
		.filter((skin): skin is Skin & { tone: number } => typeof skin.tone === 'number')
		.toSorted((a, b) => a.tone - b.tone);
	if (tones.length && tones.length !== SKIN_TONE_MODIFIERS.length) {
		throw new Error(
			`"${id}" has ${tones.length} uniform tone variants, expected ${SKIN_TONE_MODIFIERS.length}`,
		);
	}

	const derivable = tones.every((skin, i) => applySkinTone(emoji.emoji, i + 2, modifierBases) === skin.emoji);

	entries.push({
		emoticons:
			emoji.emoticon === undefined ? [] : Array.isArray(emoji.emoticon) ? emoji.emoticon : [emoji.emoticon],
		id,
		keywords,
		name,
		native: emoji.emoji,
		section,
		sortOrder: emoji.order ?? Number.MAX_SAFE_INTEGER,
		toneOverrides: derivable ? [] : tones.map((skin) => skin.emoji),
		toned: tones.length > 0,
		version: emoji.version,
	});
}

// #endregion

// #region order

const bySection = new Map<string, Entry[]>(
	SECTIONS.map((section) => [
		section,
		entries.filter((entry) => entry.section === section).toSorted((a, b) => a.sortOrder - b.sortOrder),
	]),
);
const ordered = SECTIONS.flatMap((section) => bySection.get(section)!);

// #endregion

// #region encode

const versions = [...new Set(ordered.map((entry) => entry.version))].toSorted((a, b) => a - b);
if (versions.length > 36) {
	throw new Error(`${versions.length} emoji versions exceed the single base36 digit encoding`);
}
const versionIndex = new Map(versions.map((version, i) => [version, i]));

{
	const declared = new Set(VERSION_PROBES.map((probe) => probe.version));
	for (const version of versions) {
		if (!declared.has(version)) {
			throw new Error(`emoji version ${version} has no entry in VERSION_PROBES`);
		}
	}

	const byNative = new Map(ordered.map((entry) => [entry.native, entry]));
	const sourceByNative = new Map(source.map((emoji) => [emoji.emoji, emoji]));
	for (const { glyph, version } of VERSION_PROBES) {
		if (!versions.includes(version)) {
			throw new Error(`VERSION_PROBES declares version ${version}, which no emoji uses`);
		}
		if (glyph === null) {
			continue;
		}

		const entry = byNative.get(glyph);
		if (!entry) {
			throw new Error(`probe "${glyph}" for version ${version} is not in the dataset`);
		}
		if (entry.version !== version) {
			throw new Error(`probe "${glyph}" is version ${entry.version}, declared as ${version}`);
		}
		// sequence probes can pass through their component glyphs.
		if (isSequence(glyph)) {
			throw new Error(`probe "${glyph}" for version ${version} is a sequence, not a lone code point`);
		}
		// text-presentation probes would fail the color test.
		if (sourceByNative.get(glyph)?.type !== 1) {
			throw new Error(`probe "${glyph}" for version ${version} does not default to emoji presentation`);
		}
	}
}

const overrides = ordered.flatMap((entry, index) =>
	entry.toneOverrides.length ? [`${index.toString(36)}:${entry.toneOverrides.join(' ')}`] : [],
);

const column = (name: string, values: string[]) => {
	const offender = values.findIndex((value) => value.includes(RECORD));
	if (offender !== -1) {
		throw new Error(
			`${name}[${offender}] contains the record separator: ${JSON.stringify(values[offender])}`,
		);
	}
	return values.join(RECORD);
};

const render = {
	ids: column(
		'ids',
		ordered.map((entry) => entry.id),
	),
	modifierBases: [...modifierBases]
		.toSorted((a, b) => a - b)
		.map((point) => point.toString(16))
		.join(','),
	names: column(
		'names',
		ordered.map((entry) => (titleCase(entry.id) === entry.name ? '' : entry.name)),
	),
	natives: column(
		'natives',
		ordered.map((entry) => entry.native),
	),
	sections: SECTIONS.map((section) => `${section}:${bySection.get(section)!.length}`).join(','),
	toneOverrides: overrides.join(','),
	tones: ordered.map((entry) => (entry.toned ? '1' : '0')).join(''),
	versionList: versions.join(','),
	versions: ordered.map((entry) => versionIndex.get(entry.version)!.toString(36)).join(''),
};

const search = {
	emoticons: column(
		'emoticons',
		ordered.map((entry) => entry.emoticons.join(' ')),
	),
	keywords: column(
		'keywords',
		ordered.map((entry) => entry.keywords.join(' ')),
	),
};

const renderPayload = JSON.stringify(render);
const searchPayload = JSON.stringify(search);
await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/render.json`, renderPayload);
await writeFile(`${OUT_DIR}/keywords.json`, searchPayload);

// #endregion

const kib = (value: string) => `${(Buffer.byteLength(value) / 1024).toFixed(1)} KiB`;
const named = ordered.filter((entry) => titleCase(entry.id) !== entry.name).length;
console.log(`emoji          ${ordered.length}`);
console.log(`sections       ${SECTIONS.map((s) => `${s} ${bySection.get(s)!.length}`).join(', ')}`);
console.log(`versions       ${versions.join(', ')}`);
console.log(`tone bases     ${modifierBases.size}, overrides ${overrides.length}`);
console.log(`names kept     ${named} of ${ordered.length} (${ordered.length - named} derived from the id)`);
console.log(`render.json    ${kib(renderPayload)}`);
console.log(`keywords.json  ${kib(searchPayload)}`);
