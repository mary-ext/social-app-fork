import type { ComponentType, SVGProps } from 'react';

import * as styles from '#/features/gifPicker/components/GifCategoryPills.css';

import { Button, ButtonIcon } from '#/components/web/Button';

import Celebrate from '#/icons/central/Celebrate_round_outlined_radius1_stroke2.svg';
import Clock from '#/icons/central/Clock_round_outlined_radius1_stroke2.svg';
import EmojiSad from '#/icons/central/EmojiSad_round_outlined_radius1_stroke2.svg';
import EmojiSmile from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import Heart from '#/icons/central/Heart2_round_outlined_radius1_stroke2.svg';
import Shaka from '#/icons/central/Shaka1_round_outlined_radius1_stroke2.svg';
import Trending from '#/icons/central/Trending3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type GifCategory = {
	id: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
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
