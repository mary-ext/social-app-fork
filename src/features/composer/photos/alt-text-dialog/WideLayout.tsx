import type { ReactNode } from 'react';

import * as Dialog from '#/components/Dialog';

import * as styles from './WideLayout.css';

type Props = {
	/** The editor column: the alt text field, then whatever sits under it. */
	children: ReactNode;
	imageUrl: string;
};

/**
 * Desktop layout: the image takes a column of its own and never has to give ground, so nothing here shrinks
 * on scroll. The editor column scrolls by itself beside it.
 */
export const WideLayout = ({ children, imageUrl }: Props): ReactNode => {
	return (
		<Dialog.Body>
			<div className={styles.grid}>
				<div className={styles.media}>
					<img alt="" className={styles.image} src={imageUrl} />
				</div>
				<div className={styles.editorCell}>
					<div className={styles.editor}>{children}</div>
				</div>
			</div>
		</Dialog.Body>
	);
};
