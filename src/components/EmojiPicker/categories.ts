import type { ComponentType } from 'react';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

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

/** a picker section: the representative nav icon and localized header label for a section key. */
type EmojiCategory = {
	icon: ComponentType<IconProps>;
	key: string;
	label: MessageDescriptor;
};

/**
 * the picker's sections in display order: `recent` first, then the `@emoji-mart/data` categories in their
 * fixed order. each carries the icon shown in the nav bar and the descriptor for its header label.
 */
export const CATEGORIES = [
	{ icon: ClockIcon, key: 'recent', label: msg`Recently used` },
	{ icon: EmojiIcon, key: 'people', label: msg`Smileys & People` },
	{ icon: GrowthIcon, key: 'nature', label: msg`Animals & Nature` },
	{ icon: AppleIcon, key: 'foods', label: msg`Food & Drink` },
	{ icon: TennisIcon, key: 'activity', label: msg`Activity` },
	{ icon: CarIcon, key: 'places', label: msg`Travel & Places` },
	{ icon: LightbulbIcon, key: 'objects', label: msg`Objects` },
	{ icon: ShapesIcon, key: 'symbols', label: msg`Symbols` },
	{ icon: FlagIcon, key: 'flags', label: msg`Flags` },
] as const satisfies readonly EmojiCategory[];

/** section key → its header label descriptor, for resolving labels by a row's section key. */
export const CATEGORY_LABELS: Record<string, MessageDescriptor> = Object.fromEntries(
	CATEGORIES.map((category) => [category.key, category.label]),
);
