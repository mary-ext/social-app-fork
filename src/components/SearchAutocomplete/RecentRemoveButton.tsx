import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';

import * as css from './RecentRemoveButton.css';

/**
 * trailing remove control on a recent-history row. sits beside the `Autocomplete.Item` so a click removes the
 * entry without committing the row, suppressing mousedown to keep input focus and leave the popup open.
 */
export function RecentRemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<Button
			className={css.remove}
			color="secondary"
			label={label}
			onClick={onRemove}
			onMouseDown={(event) => event.preventDefault()}
			shape="round"
			size="tiny"
			variant="ghost"
		>
			<ButtonIcon icon={XIcon} size="xs" />
		</Button>
	);
}
