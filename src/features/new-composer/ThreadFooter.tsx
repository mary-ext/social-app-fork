import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { usePostCount } from './context';
import { InteractionSettingsButton } from './interaction/InteractionSettingsButton';
import * as styles from './ThreadFooter.css';

/**
 * thread interaction settings and publish button.
 *
 * @returns the pinned footer row
 */
export function ThreadFooter() {
	return (
		<div className={styles.root}>
			<div className={styles.start}>
				<InteractionSettingsButton />
			</div>

			<div className={styles.end}>
				<PublishButton />
			</div>
		</div>
	);
}

function PublishButton() {
	const isThread = usePostCount() > 1;
	const publishLabel = isThread
		? m['view.composer.publish.a11y.posts']()
		: m['view.composer.publish.a11y.post']();
	const publishText = isThread ? m['view.composer.publish.action.all']() : m['navigation.post.title']();

	// TODO: publish the thread.
	return (
		<Button color="primary" size="small" label={publishLabel}>
			<ButtonText>{publishText}</ButtonText>
		</Button>
	);
}
