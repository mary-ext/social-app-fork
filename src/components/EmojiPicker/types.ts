/** represents an emoji selected from the picker. sourced from the `emoji-mart` library's selection data. */
export type Emoji = {
	aliases?: string[];
	emoticons: string[];
	id: string;
	keywords: string[];
	name: string;
	/** The native unicode character for the emoji, e.g. "😀" */
	native: string;
	shortcodes?: string;
	/** The unicode codepoint, e.g. "1f600" */
	unified: string;
	/** Skin tone variant (1–6), if applicable */
	skin?: number;
};
