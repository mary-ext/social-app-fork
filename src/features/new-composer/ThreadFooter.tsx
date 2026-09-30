import type { ReactNode } from 'react';

import * as Dialog from '#/components/Dialog';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './ThreadFooter.css';

/**
 * thread interaction settings and publish button.
 *
 * @param props the post count and interaction settings control
 * @returns the dialog footer
 */
export function ThreadFooter({ postCount, settings }: { postCount: number; settings: ReactNode }) {
	const isThread = postCount > 1;
	const publishLabel = isThread
		? m['view.composer.publish.a11y.posts']()
		: m['view.composer.publish.a11y.post']();
	const publishText = isThread ? m['view.composer.publish.action.all']() : m['navigation.post.title']();

	return (
		<Dialog.Footer>
			<div className={styles.root}>
				<div className={styles.start}>{settings}</div>

				<div className={styles.end}>
					{/* TODO: publish the thread. */}
					<Button color="primary" size="small" label={publishLabel}>
						<ButtonText>{publishText}</ButtonText>
					</Button>
				</div>
			</div>
		</Dialog.Footer>
	);
}
