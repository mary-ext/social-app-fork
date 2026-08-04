export type VersionProbe = {
	glyph: string | null;
	version: number;
};

export const VERSION_PROBES: readonly VersionProbe[] = [
	{ glyph: '\u{1F603}', version: 0.6 }, // smiley
	{ glyph: '\u{1F610}\u{FE0F}', version: 0.7 }, // neutral face
	{ glyph: '\u{1F600}', version: 1 }, // grinning
	{ glyph: null, version: 2 },
	{ glyph: '\u{1F923}', version: 3 }, // rolling on the floor laughing
	{ glyph: null, version: 4 },
	{ glyph: '\u{1F929}', version: 5 }, // star-struck
	{ glyph: '\u{1F970}', version: 11 }, // smiling face with hearts
	{ glyph: '\u{1F971}', version: 12 }, // yawning face
	{ glyph: null, version: 12.1 }, // hair sequences
	{ glyph: '\u{1F972}', version: 13 }, // smiling face with tear
	{ glyph: null, version: 13.1 }, // compound faces
	{ glyph: '\u{1FAE0}', version: 14 }, // melting face
	{ glyph: '\u{1FAE8}', version: 15 }, // shaking face
	{ glyph: null, version: 15.1 }, // directional people
	{ glyph: '\u{1FAE9}', version: 16 }, // face with bags under eyes
	{ glyph: '\u{1FAEA}', version: 17 }, // distorted face
];
