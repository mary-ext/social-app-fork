import type { ReactNode } from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './SearchBar.css';

/**
 * the picker's search row: a leading magnifying-glass icon, a Base UI {@link Autocomplete.Input}, a trailing
 * clear button (shown only while the query is non-empty), and an optional persistent accessory slot (e.g. the
 * skin-tone selector) composed via `children`. must render inside an `Autocomplete.Root`.
 */
export function SearchBar({ children }: { children?: ReactNode }) {
	return (
		<div className={styles.row}>
			<div className={styles.field}>
				<MagnifyingGlassIcon className={styles.icon} size="lg" fill="currentColor" />
				<Autocomplete.Input
					autoFocus
					className={clsx(styles.input, styles.inputWithAccessory)}
					placeholder={m['components.emojiPicker.search.placeholder']()}
				/>
				<div className={styles.accessory}>
					<Autocomplete.Clear
						render={
							<Button
								color="secondary"
								label={m['common.search.action.clear']()}
								shape="round"
								size="tiny"
								variant="ghost"
							>
								<ButtonIcon icon={XIcon} size="xs" />
							</Button>
						}
					/>
					{children}
				</div>
			</div>
		</div>
	);
}
