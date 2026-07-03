import type { ReactNode } from 'react';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './SearchBar.css';

/**
 * picker's search row containing a leading search icon, an input field, a conditional clear button, and an
 * optional accessory slot. must be rendered inside an `Autocomplete.Root`.
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
