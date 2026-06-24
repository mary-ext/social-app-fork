import type { ComponentType } from 'react';
import { useLingui } from '@lingui/react/macro';

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

/**
 * category section keys in display order: `recent` first, then the `@emoji-mart/data` categories in their
 * fixed order.
 */
export const CATEGORY_KEYS = [
	'recent',
	'people',
	'nature',
	'foods',
	'activity',
	'places',
	'objects',
	'symbols',
	'flags',
] as const;

/** a picker section key: `recent` plus the dataset's fixed category ids. */
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** representative icon shown in the category nav bar for each section key. */
export const CATEGORY_ICONS: Record<CategoryKey, ComponentType<IconProps>> = {
	activity: TennisIcon,
	flags: FlagIcon,
	foods: AppleIcon,
	nature: GrowthIcon,
	objects: LightbulbIcon,
	people: EmojiIcon,
	places: CarIcon,
	recent: ClockIcon,
	symbols: ShapesIcon,
};

/**
 * returns a resolver from a section key to its localized display label; unknown keys fall back to the key
 * itself.
 *
 * @returns the key → label resolver
 */
export function useCategoryLabel(): (key: string) => string {
	const { t } = useLingui();
	return (key) => {
		switch (key) {
			case 'activity':
				return t`Activity`;
			case 'flags':
				return t`Flags`;
			case 'foods':
				return t`Food & Drink`;
			case 'nature':
				return t`Animals & Nature`;
			case 'objects':
				return t`Objects`;
			case 'people':
				return t`Smileys & People`;
			case 'places':
				return t`Travel & Places`;
			case 'recent':
				return t`Recently used`;
			case 'symbols':
				return t`Symbols`;
			default:
				return key;
		}
	};
}
