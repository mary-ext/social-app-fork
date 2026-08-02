import type { ComponentType, SVGProps } from 'react';

import AppleIcon from '#/icons/central/Apples_round_outlined_radius1_stroke2.svg';
import CarIcon from '#/icons/central/Car1_round_outlined_radius1_stroke2.svg';
import ClockIcon from '#/icons/central/Clock_round_outlined_radius1_stroke2.svg';
import EmojiIcon from '#/icons/central/EmojiGrinning_round_outlined_radius1_stroke2.svg';
import FlagIcon from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import GrowthIcon from '#/icons/central/Growth_round_outlined_radius1_stroke2.svg';
import LightbulbIcon from '#/icons/central/LightBulbSimple_round_outlined_radius1_stroke2.svg';
import ShapesIcon from '#/icons/central/ShapesPlusXSquareCircle_round_outlined_radius1_stroke2.svg';
import TennisIcon from '#/icons/central/Tennis_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/** a picker section: the representative nav icon and localized header label for a section key. */
type EmojiCategory = {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	key: string;
	label: () => string;
};

/** picker's sections in display order: `recent` followed by `@emoji-mart/data` categories. */
export const CATEGORIES = [
	{ icon: ClockIcon, key: 'recent', label: m['common.status.recentlyUsed'] },
	{ icon: EmojiIcon, key: 'people', label: m['components.emojiPicker.category.smileysPeople'] },
	{ icon: GrowthIcon, key: 'nature', label: m['components.emojiPicker.category.animalsNature'] },
	{ icon: AppleIcon, key: 'foods', label: m['components.emojiPicker.category.foodDrink'] },
	{ icon: TennisIcon, key: 'activity', label: m['components.emojiPicker.category.activity'] },
	{ icon: CarIcon, key: 'places', label: m['components.emojiPicker.category.travelPlaces'] },
	{ icon: LightbulbIcon, key: 'objects', label: m['components.emojiPicker.category.objects'] },
	{ icon: ShapesIcon, key: 'symbols', label: m['components.emojiPicker.category.symbols'] },
	{ icon: FlagIcon, key: 'flags', label: m['components.emojiPicker.category.flags'] },
] as const satisfies readonly EmojiCategory[];

/** section key → its header label message, for resolving labels by a row's section key. */
export const CATEGORY_LABELS: Record<string, () => string> = Object.fromEntries(
	CATEGORIES.map((category) => [category.key, category.label]),
);
