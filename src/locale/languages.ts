import type { Locale } from '#/paraglide/runtime';

export interface Language {
	/** Stable lookup key: the language's ISO 639-2/T (or, when it has no 639-2 code, 639-3) three-letter code. */
	id: string;
	/** ISO 639-1 two-letter code, when the language has one. */
	code2?: string;
}

/** The UI-translation languages the app offers, keyed by paraglide locale code. */
export const APP_LANGUAGES: { code2: Locale; name: string }[] = [{ code2: 'en', name: 'English' }];

/**
 * Languages offered for tagging posts and filtering feeds. Curated down from the full ISO 639 set to living
 * languages people actually post in. Display names are resolved at runtime via `Intl.DisplayNames` (see
 * `languageName`), so none are stored here — the trailing comments are just for readability.
 */
export const LANGUAGES: Language[] = [
	{ id: 'aar', code2: 'aa' }, // Afar
	{ id: 'abk', code2: 'ab' }, // Abkhazian
	{ id: 'afr', code2: 'af' }, // Afrikaans
	{ id: 'aka', code2: 'ak' }, // Akan
	{ id: 'amh', code2: 'am' }, // Amharic
	{ id: 'ara', code2: 'ar' }, // Arabic
	{ id: 'arg', code2: 'an' }, // Aragonese
	{ id: 'asm', code2: 'as' }, // Assamese
	{ id: 'ast' }, // Asturian
	{ id: 'ava', code2: 'av' }, // Avaric
	{ id: 'aym', code2: 'ay' }, // Aymara
	{ id: 'aze', code2: 'az' }, // Azerbaijani
	{ id: 'bak', code2: 'ba' }, // Bashkir
	{ id: 'bam', code2: 'bm' }, // Bambara
	{ id: 'bel', code2: 'be' }, // Belarusian
	{ id: 'ben', code2: 'bn' }, // Bangla
	{ id: 'bih', code2: 'bh' }, // Bhojpuri
	{ id: 'bis', code2: 'bi' }, // Bislama
	{ id: 'bod', code2: 'bo' }, // Tibetan
	{ id: 'bos', code2: 'bs' }, // Bosnian
	{ id: 'bre', code2: 'br' }, // Breton
	{ id: 'bul', code2: 'bg' }, // Bulgarian
	{ id: 'cat', code2: 'ca' }, // Catalan
	{ id: 'ces', code2: 'cs' }, // Czech
	{ id: 'cha', code2: 'ch' }, // Chamorro
	{ id: 'che', code2: 'ce' }, // Chechen
	{ id: 'chr' }, // Cherokee
	{ id: 'chv', code2: 'cv' }, // Chuvash
	{ id: 'ckb' }, // Central Kurdish
	{ id: 'cnr' }, // Montenegrin
	{ id: 'cor', code2: 'kw' }, // Cornish
	{ id: 'cos', code2: 'co' }, // Corsican
	{ id: 'cre', code2: 'cr' }, // Cree
	{ id: 'csb' }, // Kashubian
	{ id: 'cym', code2: 'cy' }, // Welsh
	{ id: 'dan', code2: 'da' }, // Danish
	{ id: 'deu', code2: 'de' }, // German
	{ id: 'div', code2: 'dv' }, // Divehi
	{ id: 'dzo', code2: 'dz' }, // Dzongkha
	{ id: 'ell', code2: 'el' }, // Greek
	{ id: 'eng', code2: 'en' }, // English
	{ id: 'epo', code2: 'eo' }, // Esperanto
	{ id: 'est', code2: 'et' }, // Estonian
	{ id: 'eus', code2: 'eu' }, // Basque
	{ id: 'ewe', code2: 'ee' }, // Ewe
	{ id: 'fao', code2: 'fo' }, // Faroese
	{ id: 'fas', code2: 'fa' }, // Persian
	{ id: 'fij', code2: 'fj' }, // Fijian
	{ id: 'fin', code2: 'fi' }, // Finnish
	{ id: 'fra', code2: 'fr' }, // French
	{ id: 'fry', code2: 'fy' }, // Western Frisian
	{ id: 'ful', code2: 'ff' }, // Fula
	{ id: 'gla', code2: 'gd' }, // Scottish Gaelic
	{ id: 'gle', code2: 'ga' }, // Irish
	{ id: 'glg', code2: 'gl' }, // Galician
	{ id: 'glv', code2: 'gv' }, // Manx
	{ id: 'grn', code2: 'gn' }, // Guarani
	{ id: 'gsw' }, // Swiss German
	{ id: 'guj', code2: 'gu' }, // Gujarati
	{ id: 'hat', code2: 'ht' }, // Haitian Creole
	{ id: 'hau', code2: 'ha' }, // Hausa
	{ id: 'heb', code2: 'he' }, // Hebrew
	{ id: 'her', code2: 'hz' }, // Herero
	{ id: 'hin', code2: 'hi' }, // Hindi
	{ id: 'hmo', code2: 'ho' }, // Hiri Motu
	{ id: 'hrv', code2: 'hr' }, // Croatian
	{ id: 'hun', code2: 'hu' }, // Hungarian
	{ id: 'hye', code2: 'hy' }, // Armenian
	{ id: 'ibo', code2: 'ig' }, // Igbo
	{ id: 'iii', code2: 'ii' }, // Sichuan Yi
	{ id: 'iku', code2: 'iu' }, // Inuktitut
	{ id: 'ind', code2: 'id' }, // Indonesian
	{ id: 'ipk', code2: 'ik' }, // Inupiaq
	{ id: 'isl', code2: 'is' }, // Icelandic
	{ id: 'ita', code2: 'it' }, // Italian
	{ id: 'jav', code2: 'jv' }, // Javanese
	{ id: 'jbo' }, // Lojban
	{ id: 'jpn', code2: 'ja' }, // Japanese
	{ id: 'kab' }, // Kabyle
	{ id: 'kal', code2: 'kl' }, // Kalaallisut
	{ id: 'kan', code2: 'kn' }, // Kannada
	{ id: 'kas', code2: 'ks' }, // Kashmiri
	{ id: 'kat', code2: 'ka' }, // Georgian
	{ id: 'kau', code2: 'kr' }, // Kanuri
	{ id: 'kaz', code2: 'kk' }, // Kazakh
	{ id: 'khm', code2: 'km' }, // Khmer
	{ id: 'kik', code2: 'ki' }, // Kikuyu
	{ id: 'kin', code2: 'rw' }, // Kinyarwanda
	{ id: 'kir', code2: 'ky' }, // Kyrgyz
	{ id: 'kom', code2: 'kv' }, // Komi
	{ id: 'kon', code2: 'kg' }, // Kongo
	{ id: 'kor', code2: 'ko' }, // Korean
	{ id: 'kua', code2: 'kj' }, // Kuanyama
	{ id: 'kur', code2: 'ku' }, // Kurdish
	{ id: 'lao', code2: 'lo' }, // Lao
	{ id: 'lav', code2: 'lv' }, // Latvian
	{ id: 'lim', code2: 'li' }, // Limburgish
	{ id: 'lin', code2: 'ln' }, // Lingala
	{ id: 'lit', code2: 'lt' }, // Lithuanian
	{ id: 'ltz', code2: 'lb' }, // Luxembourgish
	{ id: 'lub', code2: 'lu' }, // Luba-Katanga
	{ id: 'lug', code2: 'lg' }, // Ganda
	{ id: 'mah', code2: 'mh' }, // Marshallese
	{ id: 'mal', code2: 'ml' }, // Malayalam
	{ id: 'mar', code2: 'mr' }, // Marathi
	{ id: 'mkd', code2: 'mk' }, // Macedonian
	{ id: 'mlg', code2: 'mg' }, // Malagasy
	{ id: 'mlt', code2: 'mt' }, // Maltese
	{ id: 'mon', code2: 'mn' }, // Mongolian
	{ id: 'mri', code2: 'mi' }, // Māori
	{ id: 'msa', code2: 'ms' }, // Malay
	{ id: 'mya', code2: 'my' }, // Burmese
	{ id: 'nau', code2: 'na' }, // Nauru
	{ id: 'nav', code2: 'nv' }, // Navajo
	{ id: 'nbl', code2: 'nr' }, // South Ndebele
	{ id: 'nde', code2: 'nd' }, // North Ndebele
	{ id: 'ndo', code2: 'ng' }, // Ndonga
	{ id: 'nds' }, // Low German
	{ id: 'nep', code2: 'ne' }, // Nepali
	{ id: 'nld', code2: 'nl' }, // Dutch
	{ id: 'nno', code2: 'nn' }, // Norwegian Nynorsk
	{ id: 'nob', code2: 'nb' }, // Norwegian Bokmål
	{ id: 'nor', code2: 'no' }, // Norwegian
	{ id: 'nya', code2: 'ny' }, // Nyanja
	{ id: 'oci', code2: 'oc' }, // Occitan
	{ id: 'oji', code2: 'oj' }, // Ojibwa
	{ id: 'ori', code2: 'or' }, // Odia
	{ id: 'orm', code2: 'om' }, // Oromo
	{ id: 'oss', code2: 'os' }, // Ossetic
	{ id: 'pan', code2: 'pa' }, // Punjabi
	{ id: 'pol', code2: 'pl' }, // Polish
	{ id: 'por', code2: 'pt' }, // Portuguese
	{ id: 'pus', code2: 'ps' }, // Pashto
	{ id: 'que', code2: 'qu' }, // Quechua
	{ id: 'roh', code2: 'rm' }, // Romansh
	{ id: 'ron', code2: 'ro' }, // Romanian
	{ id: 'run', code2: 'rn' }, // Rundi
	{ id: 'rus', code2: 'ru' }, // Russian
	{ id: 'sag', code2: 'sg' }, // Sango
	{ id: 'sco' }, // Scots
	{ id: 'sin', code2: 'si' }, // Sinhala
	{ id: 'slk', code2: 'sk' }, // Slovak
	{ id: 'slv', code2: 'sl' }, // Slovenian
	{ id: 'sma' }, // Southern Sami
	{ id: 'sme', code2: 'se' }, // Northern Sami
	{ id: 'smj' }, // Lule Sami
	{ id: 'smo', code2: 'sm' }, // Samoan
	{ id: 'sna', code2: 'sn' }, // Shona
	{ id: 'snd', code2: 'sd' }, // Sindhi
	{ id: 'som', code2: 'so' }, // Somali
	{ id: 'sot', code2: 'st' }, // Southern Sotho
	{ id: 'spa', code2: 'es' }, // Spanish
	{ id: 'sqi', code2: 'sq' }, // Albanian
	{ id: 'srd', code2: 'sc' }, // Sardinian
	{ id: 'srp', code2: 'sr' }, // Serbian
	{ id: 'ssw', code2: 'ss' }, // Swati
	{ id: 'sun', code2: 'su' }, // Sundanese
	{ id: 'swa', code2: 'sw' }, // Swahili
	{ id: 'swe', code2: 'sv' }, // Swedish
	{ id: 'szl' }, // Silesian
	{ id: 'tah', code2: 'ty' }, // Tahitian
	{ id: 'tam', code2: 'ta' }, // Tamil
	{ id: 'tat', code2: 'tt' }, // Tatar
	{ id: 'tel', code2: 'te' }, // Telugu
	{ id: 'tgk', code2: 'tg' }, // Tajik
	{ id: 'tgl', code2: 'tl' }, // Filipino
	{ id: 'tha', code2: 'th' }, // Thai
	{ id: 'tir', code2: 'ti' }, // Tigrinya
	{ id: 'tok' }, // Toki Pona
	{ id: 'ton', code2: 'to' }, // Tongan
	{ id: 'tsn', code2: 'tn' }, // Tswana
	{ id: 'tso', code2: 'ts' }, // Tsonga
	{ id: 'tuk', code2: 'tk' }, // Turkmen
	{ id: 'tur', code2: 'tr' }, // Turkish
	{ id: 'twi', code2: 'tw' }, // Akan
	{ id: 'uig', code2: 'ug' }, // Uyghur
	{ id: 'ukr', code2: 'uk' }, // Ukrainian
	{ id: 'urd', code2: 'ur' }, // Urdu
	{ id: 'uzb', code2: 'uz' }, // Uzbek
	{ id: 'vai' }, // Vai
	{ id: 'ven', code2: 've' }, // Venda
	{ id: 'vie', code2: 'vi' }, // Vietnamese
	{ id: 'wln', code2: 'wa' }, // Walloon
	{ id: 'wol', code2: 'wo' }, // Wolof
	{ id: 'xal' }, // Kalmyk
	{ id: 'xho', code2: 'xh' }, // Xhosa
	{ id: 'xmf' }, // Mingrelian
	{ id: 'yid', code2: 'yi' }, // Yiddish
	{ id: 'yor', code2: 'yo' }, // Yoruba
	{ id: 'zgh' }, // Standard Moroccan Tamazight
	{ id: 'zha', code2: 'za' }, // Zhuang
	{ id: 'zho', code2: 'zh' }, // Chinese
	{ id: 'zul', code2: 'zu' }, // Zulu
];

/** The BCP-47 code the app reads and writes for a language: its two-letter code when it has one, else its id. */
export const langCode = (lang: Language): string => lang.code2 ?? lang.id;

/** Every language keyed by each code that can identify it — its id, and its two-letter code when present. */
export const LANGUAGES_MAP: Record<string, Language> = {};
for (const lang of LANGUAGES) {
	LANGUAGES_MAP[lang.id] = lang;
	if (lang.code2) {
		LANGUAGES_MAP[lang.code2] = lang;
	}
}
// some clients tag Persian posts with 'pes' (Iranian Persian, ISO 639-3); resolve it to Persian
if (LANGUAGES_MAP.fas) {
	LANGUAGES_MAP.pes = LANGUAGES_MAP.fas;
}
