import type { Props as IconProps } from '#/components/icons/common';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './Lightbox.css';

/**
 * centered spinner overlay filling its positioned parent, shown while a slide image or the engine chunk
 * loads.
 */
export function LightboxLoading({ size = '3xl' }: { size?: IconProps['size'] }) {
	return (
		<div className={styles.slideSpinner}>
			<Spinner color="white" label={m['components.lightbox.a11y.loading']()} size={size} />
		</div>
	);
}
