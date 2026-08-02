import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';
import type { iconSize } from '#/styles/tokens.css';

import * as styles from './Lightbox.css';

/**
 * centered spinner overlay filling its positioned parent, shown while a slide image or the engine chunk
 * loads.
 */
export function LightboxLoading({ size = '_3xl' }: { size?: keyof typeof iconSize }) {
	return (
		<div className={styles.slideSpinner}>
			<Spinner color="white" label={m['components.lightbox.a11y.loading']()} size={size} />
		</div>
	);
}
