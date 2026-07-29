import { type ReactNode, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import * as Dialog from '#/components/Dialog';

import * as styles from './CompactLayout.css';

type Props = {
	children: ReactNode;
	imageUrl: string;
};

export const CompactLayout = ({ children, imageUrl }: Props): React.ReactNode => {
	const [fullHeight, setFullHeight] = useState(0);

	const scrollAway = fullHeight * (1 - styles.COLLAPSED_SCALE);

	return (
		<Dialog.Body className={styles.scroller}>
			<div
				ref={(node) => {
					if (node === null) {
						return;
					}

					const observer = new ResizeObserver((entries) => {
						const entry = entries[0]!;
						setFullHeight(entry.contentRect.height);
					});

					observer.observe(node);
					return () => observer.disconnect();
				}}
				className={styles.media}
				style={assignInlineVars({
					[styles.offsetVar]: `${-scrollAway}px`,
					[styles.rangeVar]: `${scrollAway}px`,
				})}
			>
				<img alt="" className={styles.image} src={imageUrl} />
			</div>

			<div className={styles.editor}>{children}</div>
		</Dialog.Body>
	);
};
