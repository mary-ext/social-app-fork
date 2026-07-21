import { Celebrate_Stroke2_Corner0_Rounded as Celebrate } from '#/components/icons/Celebrate';
import { Clock_Stroke2_Corner0_Rounded as Clock } from '#/components/icons/Clock';
import type { Props as SVGIconProps } from '#/components/icons/common';
import {
	EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
	EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji';
import { Heart2_Stroke2_Corner0_Rounded as Heart } from '#/components/icons/Heart2';
import { Shaka_Stroke2_Corner0_Rounded as Shaka } from '#/components/icons/Shaka';
import { Trending3_Stroke2_Corner1_Rounded as Trending } from '#/components/icons/Trending';
import { Button, ButtonIcon } from '#/components/web/Button';

import * as styles from '#/features/gifPicker/components/GifCategoryPills.css';
import { m } from '#/paraglide/messages';

export type GifCategory = {
	id: string;
	icon: React.ComponentType<SVGIconProps>;
	label: () => string;
	searchterm: string | null; // null = trending/recents (handled by consumer)
};

/*
 * Category pill labels are icon-only buttons in the UI; the `label` field is
 * what screen readers announce. Each is phrased "[topic] GIFs" so the
 * announcement makes sense in isolation rather than just "Love" or "Happy".
 */
export const GIF_CATEGORIES: readonly GifCategory[] = [
	{
		id: 'recents',
		icon: Clock,
		label: m['features.gifPicker.recents.a11y'],
		searchterm: null,
	},
	{
		id: 'trending',
		icon: Trending,
		label: m['features.gifPicker.trending.a11y'],
		searchterm: null,
	},
	{
		id: 'love',
		icon: Heart,
		label: m['features.gifPicker.filters.a11y.love'],
		searchterm: 'love',
	},
	{
		id: 'happy',
		icon: EmojiSmile,
		label: m['features.gifPicker.filters.a11y.happy'],
		searchterm: 'happy',
	},
	{
		id: 'sad',
		icon: EmojiSad,
		label: m['features.gifPicker.filters.a11y.sad'],
		searchterm: 'cry',
	},
	{
		id: 'party',
		icon: Celebrate,
		label: m['features.gifPicker.filters.a11y.party'],
		searchterm: 'congratulations',
	},
	{
		id: 'yes',
		icon: Shaka,
		label: m['features.gifPicker.filters.a11y.yes'],
		searchterm: 'yes',
	},
] as const;

export function GifCategoryPills({
	activeId,
	onSelect,
	hasRecents,
}: {
	activeId: string;
	onSelect: (category: GifCategory) => void;
	hasRecents: boolean;
}) {
	return (
		<div className={styles.row}>
			{GIF_CATEGORIES.map((category) => {
				if (category.id === 'recents' && !hasRecents) {
					return null;
				}
				const isActive = category.id === activeId;
				return (
					<Button
						key={category.id}
						label={category.label()}
						aria-current={isActive ? 'true' : undefined}
						onClick={() => onSelect(category)}
						size="small"
						color={isActive ? 'secondary_inverted' : 'secondary'}
						shape="round"
					>
						<ButtonIcon icon={category.icon} size="md" />
					</Button>
				);
			})}
		</div>
	);
}
