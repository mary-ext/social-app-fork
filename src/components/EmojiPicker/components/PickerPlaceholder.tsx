import { Loader_Stroke2_Corner0_Rounded as LoaderIcon } from '#/components/icons/Loader';

import * as styles from './PickerPlaceholder.css';

/** stand-in shown while the emoji dataset downloads. */
export function PickerPlaceholder() {
	return (
		<div className={styles.placeholder}>
			<LoaderIcon className={styles.spinner} fill="currentColor" size="4xl" />
		</div>
	);
}
