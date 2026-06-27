import type { ComponentType } from 'react';

import { Apples_Stroke2_Corner0_Rounded as AppleIcon } from '#/components/icons/Apples';
import { Car1_Stroke2_Corner0_Rounded as CarIcon } from '#/components/icons/Car';
import { Clock_Stroke2_Corner0_Rounded as ClockIcon } from '#/components/icons/Clock';
import type { Props as IconProps } from '#/components/icons/common';
import { EmojiGrinning_Stroke2_Corner0_Rounded as EmojiIcon } from '#/components/icons/Emoji';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Growth_Stroke2_Corner0_Rounded as GrowthIcon } from '#/components/icons/Growth';
import { LightbulbSimple_Stroke2_Corner0_Rounded as LightbulbIcon } from '#/components/icons/Lightbulb';
import { Shapes_Stroke2_Corner0_Rounded as ShapesIcon } from '#/components/icons/Shapes';
import { Tennis_Stroke2_Corner0_Rounded as TennisIcon } from '#/components/icons/Tennis';

import { m } from '#/paraglide/messages';

/** a picker section: the representative nav icon and localized header label for a section key. */
type EmojiCategory = {
	icon: ComponentType<IconProps>;
	key: string;
	label: () => string;
};

/**
 * the picker's sections in display order: `recent` first, then the `@emoji-mart/data` categories in their
 * fixed order. each carries the icon shown in the nav bar and the descriptor for its header label.
 */
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
