import type { ComponentType, SVGProps } from 'react';

import EmojiLol from '#/icons/central/EmojiLol_round_outlined_radius1_stroke2.svg';
import EmojiStarStruck from '#/icons/central/EmojiStarStruck_round_outlined_radius1_stroke2.svg';
import Heart from '#/icons/central/Heart2_round_outlined_radius1_stroke2.svg';
import MagicHands from '#/icons/central/MagicHands_round_outlined_radius1_stroke2.svg';
import ThumbsDown from '#/icons/central/ThumbsDown_round_outlined_radius1_stroke2.svg';
import ThumbsUp from '#/icons/central/ThumbsUp_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type GifCategoryId = 'lol' | 'love' | 'no' | 'omg' | 'thanks' | 'yes';

export type GifCategory = {
	id: GifCategoryId;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: () => string;
	/** KLIPY search terms. */
	query: string;
};

/** categories in display order. keep the count divisible by 6 to fill both two- and three-column grids. */
export const GIF_CATEGORIES: readonly GifCategory[] = [
	{
		id: 'love',
		icon: Heart,
		label: m['features.gifPicker.category.love'],
		query: 'love',
	},
	{
		id: 'lol',
		icon: EmojiLol,
		label: m['features.gifPicker.category.lol'],
		query: 'lol',
	},
	{
		id: 'omg',
		icon: EmojiStarStruck,
		label: m['features.gifPicker.category.omg'],
		query: 'omg',
	},
	{
		id: 'thanks',
		icon: MagicHands,
		label: m['features.gifPicker.category.thanks'],
		query: 'thank you',
	},
	{
		id: 'yes',
		icon: ThumbsUp,
		label: m['features.gifPicker.category.yes'],
		query: 'yes',
	},
	{
		id: 'no',
		icon: ThumbsDown,
		label: m['features.gifPicker.category.no'],
		query: 'no',
	},
];

/**
 * looks up a category by id.
 *
 * @param id category id
 * @returns the matching category
 * @throws if the id has no entry in `GIF_CATEGORIES`
 */
export const getGifCategory = (id: GifCategoryId): GifCategory => {
	const category = GIF_CATEGORIES.find((c) => c.id === id);
	if (!category) {
		throw new Error(`unknown GIF category: ${id}`);
	}
	return category;
};
