import type { Gif } from '#/lib/media/external-gif/types';

import { useRecentGifs } from '#/state/preferences/recent-gifs';

import { GIF_CATEGORIES, type GifCategoryId } from '#/features/gifPicker/categories';
import * as styles from '#/features/gifPicker/components/GifPickerHome.css';
import { GifPickerItem } from '#/features/gifPicker/components/GifPickerItem';

import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

// matches the strip's column count.
const RECENTS_PREVIEW_LIMIT = 5;

/** recent GIF previews and categories above the trending feed. */
export function GifPickerHome({
	onOpenCategory,
	onOpenRecents,
	onSelectGif,
}: {
	onOpenCategory: (id: GifCategoryId) => void;
	onOpenRecents: () => void;
	onSelectGif: (gif: Gif) => void;
}) {
	const recentGifs = useRecentGifs();

	return (
		<div className={styles.root}>
			{recentGifs.length > 0 && (
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<SectionTitle>{m['features.gifPicker.recents.title']()}</SectionTitle>
						<Button
							className={styles.seeAll}
							color="primary"
							label={m['features.gifPicker.home.seeAllRecents.a11y']()}
							onClick={onOpenRecents}
							size="tiny"
							variant="ghost"
						>
							<ButtonText>{m['features.gifPicker.home.seeAllRecents']()}</ButtonText>
						</Button>
					</div>
					<div className={styles.recents}>
						{recentGifs.slice(0, RECENTS_PREVIEW_LIMIT).map((gif) => (
							<GifPickerItem key={gif.id} gif={gif} onSelectGif={onSelectGif} shape="square" />
						))}
					</div>
				</section>
			)}

			<section className={styles.section}>
				<SectionTitle>{m['features.gifPicker.home.browse']()}</SectionTitle>
				<div className={styles.categories}>
					{GIF_CATEGORIES.map(({ icon: Icon, id, label }) => (
						<button key={id} type="button" className={styles.category} onClick={() => onOpenCategory(id)}>
							<Icon className={styles.categoryIcon} aria-hidden />
							<Text
								className={styles.categoryLabel}
								weight="semiBold"
								color="textContrastHigh"
								numberOfLines={1}
							>
								{label()}
							</Text>
						</button>
					))}
				</div>
			</section>

			<SectionTitle>{m['features.gifPicker.home.trending']()}</SectionTitle>
		</div>
	);
}

function SectionTitle({ children }: { children: string }) {
	return (
		<Text aria-level={3} color="textContrastMedium" role="heading" size="md_sub" weight="semiBold">
			{children}
		</Text>
	);
}
