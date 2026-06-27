import { Select } from '@base-ui/react/select';

import { m } from '#/paraglide/messages';
import type { SkinTone } from '#/storage/hooks/emoji';

import * as styles from './SkinToneButton.css';

/** hand glyphs for each skin tone (1 = default/yellow, 2–6 = the five Fitzpatrick tones). */
const SKIN_HANDS = ['✋', '✋🏻', '✋🏼', '✋🏽', '✋🏾', '✋🏿'];

const TONES: SkinTone[] = [1, 2, 3, 4, 5, 6];

/** a Base UI Select of tone swatches to choose the active emoji skin tone. */
export function SkinToneButton({ onChange, tone }: { onChange: (tone: SkinTone) => void; tone: SkinTone }) {
	return (
		<Select.Root
			value={tone}
			onValueChange={(next) => {
				if (next) {
					onChange(next);
				}
			}}
		>
			<Select.Trigger aria-label={m['components.emojiPicker.skinTone']()} className={styles.trigger}>
				<Select.Value className={styles.glyph}>{(value: SkinTone) => SKIN_HANDS[value - 1]}</Select.Value>
			</Select.Trigger>

			<Select.Portal>
				<Select.Positioner className={styles.positioner}>
					<Select.Popup className={styles.menu}>
						{TONES.map((value) => (
							<Select.Item
								aria-label={m['components.emojiPicker.skinToneValue']({ value })}
								className={styles.item}
								key={value}
								value={value}
							>
								<Select.ItemText className={styles.glyph}>{SKIN_HANDS[value - 1]}</Select.ItemText>
							</Select.Item>
						))}
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}
