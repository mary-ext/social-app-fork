import type { Emoji as DataEmoji } from '@emoji-mart/data';

import type { SkinTone } from '#/storage/hooks/emoji';

import type { Emoji } from './types';

/**
 * a renderable emoji cell: a section-scoped key, the tone-adjusted native glyph, and the source dataset
 * emoji.
 */
export type EmojiCell = {
	emoji: DataEmoji;
	key: string;
	native: string;
};

/**
 * returns the native glyph for an emoji at the given skin tone, falling back to the default skin for emoji
 * without tone variants.
 *
 * @param emoji the dataset emoji
 * @param tone the skin tone to apply
 * @returns the tone-adjusted native glyph
 */
export function nativeForTone(emoji: DataEmoji, tone: SkinTone): string {
	return (emoji.skins[tone - 1] ?? emoji.skins[0]!).native;
}

/**
 * builds a {@link EmojiCell} for an emoji within a section.
 *
 * @param emoji the dataset emoji
 * @param tone the skin tone to apply
 * @param sectionKey the key of the section the cell belongs to
 * @returns the renderable cell
 */
export function makeCell(emoji: DataEmoji, tone: SkinTone, sectionKey: string): EmojiCell {
	return { emoji, key: `${sectionKey}:${emoji.id}`, native: nativeForTone(emoji, tone) };
}

/**
 * converts a dataset emoji to the {@link Emoji} selection shape, applying the skin tone.
 *
 * @param emoji the dataset emoji
 * @param tone the skin tone to apply
 * @returns the selection-shape emoji
 */
export function toSelection(emoji: DataEmoji, tone: SkinTone): Emoji {
	const skin = emoji.skins[tone - 1] ?? emoji.skins[0]!;
	return {
		emoticons: emoji.emoticons ?? [],
		id: emoji.id,
		keywords: emoji.keywords,
		name: emoji.name,
		native: skin.native,
		skin: emoji.skins.length > 1 ? tone : undefined,
		unified: skin.unified,
	};
}
