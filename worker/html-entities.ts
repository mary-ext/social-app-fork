// HTMLRewriter returns raw text and attributes, so decode scraped character references here.

/** common HTML named references; numeric references are handled separately. */
const NAMED_ENTITIES: Record<string, string> = {
	aacute: 'á',
	Aacute: 'Á',
	acirc: 'â',
	Acirc: 'Â',
	acute: '´',
	aelig: 'æ',
	AElig: 'Æ',
	agrave: 'à',
	Agrave: 'À',
	amp: '&',
	apos: "'",
	aring: 'å',
	Aring: 'Å',
	atilde: 'ã',
	Atilde: 'Ã',
	auml: 'ä',
	Auml: 'Ä',
	bdquo: '„',
	brvbar: '¦',
	bull: '•',
	ccedil: 'ç',
	Ccedil: 'Ç',
	cedil: '¸',
	cent: '¢',
	copy: '©',
	curren: '¤',
	dagger: '†',
	Dagger: '‡',
	deg: '°',
	divide: '÷',
	eacute: 'é',
	Eacute: 'É',
	ecirc: 'ê',
	Ecirc: 'Ê',
	egrave: 'è',
	Egrave: 'È',
	euml: 'ë',
	Euml: 'Ë',
	euro: '€',
	frac12: '½',
	frac14: '¼',
	frac34: '¾',
	gt: '>',
	hellip: '…',
	iacute: 'í',
	Iacute: 'Í',
	icirc: 'î',
	Icirc: 'Î',
	iexcl: '¡',
	igrave: 'ì',
	Igrave: 'Ì',
	iquest: '¿',
	iuml: 'ï',
	Iuml: 'Ï',
	laquo: '«',
	ldquo: '“',
	lsaquo: '‹',
	lsquo: '‘',
	lt: '<',
	macr: '¯',
	mdash: '—',
	micro: 'µ',
	middot: '·',
	nbsp: ' ',
	ndash: '–',
	not: '¬',
	ntilde: 'ñ',
	Ntilde: 'Ñ',
	oacute: 'ó',
	Oacute: 'Ó',
	ocirc: 'ô',
	Ocirc: 'Ô',
	oelig: 'œ',
	OElig: 'Œ',
	ograve: 'ò',
	Ograve: 'Ò',
	ordf: 'ª',
	ordm: 'º',
	oslash: 'ø',
	Oslash: 'Ø',
	otilde: 'õ',
	Otilde: 'Õ',
	ouml: 'ö',
	Ouml: 'Ö',
	para: '¶',
	permil: '‰',
	plusmn: '±',
	pound: '£',
	prime: '′',
	Prime: '″',
	quot: '"',
	raquo: '»',
	rdquo: '”',
	reg: '®',
	rsaquo: '›',
	rsquo: '’',
	sbquo: '‚',
	scaron: 'š',
	Scaron: 'Š',
	sect: '§',
	shy: '­',
	sup1: '¹',
	sup2: '²',
	sup3: '³',
	szlig: 'ß',
	thinsp: ' ',
	thorn: 'þ',
	THORN: 'Þ',
	tilde: '˜',
	times: '×',
	trade: '™',
	uacute: 'ú',
	Uacute: 'Ú',
	ucirc: 'û',
	Ucirc: 'Û',
	ugrave: 'ù',
	Ugrave: 'Ù',
	uml: '¨',
	uuml: 'ü',
	Uuml: 'Ü',
	yacute: 'ý',
	Yacute: 'Ý',
	yen: '¥',
	yuml: 'ÿ',
	Yuml: 'Ÿ',
};

/** Windows-1252 replacements used by HTML numeric references. */
const WINDOWS_1252: Record<number, number> = {
	0x80: 0x20ac,
	0x82: 0x201a,
	0x83: 0x0192,
	0x84: 0x201e,
	0x85: 0x2026,
	0x86: 0x2020,
	0x87: 0x2021,
	0x88: 0x02c6,
	0x89: 0x2030,
	0x8a: 0x0160,
	0x8b: 0x2039,
	0x8c: 0x0152,
	0x8e: 0x017d,
	0x91: 0x2018,
	0x92: 0x2019,
	0x93: 0x201c,
	0x94: 0x201d,
	0x95: 0x2022,
	0x96: 0x2013,
	0x97: 0x2014,
	0x98: 0x02dc,
	0x99: 0x2122,
	0x9a: 0x0161,
	0x9b: 0x203a,
	0x9c: 0x0153,
	0x9e: 0x017e,
	0x9f: 0x0178,
};

const ENTITY_PATTERN = /&(#[xX][\da-fA-F]+|#\d+|[a-zA-Z][\da-zA-Z]*);/g;

const decodeNumeric = (body: string): string => {
	let code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
	code = WINDOWS_1252[code] ?? code;
	// replace invalid code points before calling String.fromCodePoint.
	if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
		return '�';
	}
	return String.fromCodePoint(code);
};

/**
 * decodes named and numeric HTML character references.
 *
 * @param input text that may contain HTML entities
 * @returns text with recognized entities decoded
 */
export const decodeHtmlEntities = (input: string): string => {
	if (!input.includes('&')) {
		return input;
	}
	return input.replace(ENTITY_PATTERN, (match, body: string) => {
		if (body[0] === '#') {
			return decodeNumeric(body);
		}
		return NAMED_ENTITIES[body] ?? match;
	});
};
