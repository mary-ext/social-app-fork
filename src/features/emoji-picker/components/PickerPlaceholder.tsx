import LoaderIcon from '#/icons/original/Loader.svg';

import * as styles from './PickerPlaceholder.css';

/** stand-in shown while the emoji dataset downloads. */
export function PickerPlaceholder() {
	return (
		<div className={styles.placeholder}>
			<LoaderIcon className={styles.spinner} />
		</div>
	);
}
