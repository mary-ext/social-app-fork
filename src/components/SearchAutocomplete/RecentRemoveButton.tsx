import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';

import * as styles from './RecentRemoveButton.css';

/**
 * the trailing remove control on a recent-history row. it sits beside the `Autocomplete.Item` (not inside
 * it), so a click removes the entry without committing the row; the mousedown is suppressed to keep input
 * focus and leave the popup open for removing several in a row.
 */
export function RecentRemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<Button
			className={styles.remove}
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
