import { useEffect } from 'react';

import { ThreadgateBtn } from '#/features/composer/threadgate/ThreadgateBtn';

import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { useComposer, usePostCount, useThreadInteraction } from '../context';
import { usePublish } from '../publish/use-publish';
import * as css from './ThreadFooter.css';

/**
 * thread interaction settings and publish button.
 *
 * @returns the pinned footer row
 */
export function ThreadFooter() {
	return (
		<div className={css.root}>
			<div className={css.start}>
				<InteractionSettingsButton />
			</div>

			<div className={css.end}>
				<PublishButton />
			</div>
		</div>
	);
}

function InteractionSettingsButton() {
	const { interaction } = useComposer();
	const settings = useThreadInteraction();

	return <ThreadgateBtn value={settings} onChange={interaction.set} />;
}

function PublishButton() {
	const { handlePublishKey } = useComposer();
	const { blocker, isPublishing, publish } = usePublish();
	const isThread = usePostCount() > 1;
	const publishLabel = isThread
		? m['view.composer.publish.a11y.posts']()
		: m['view.composer.publish.a11y.post']();
	const publishText = isThread ? m['view.composer.publish.action.all']() : m['navigation.post.title']();

	useEffect(() => {
		return handlePublishKey(() => void publish());
	}, [handlePublishKey, publish]);

	return (
		<Button
			color="primary"
			size="small"
			label={publishLabel}
			disabled={blocker !== null || isPublishing}
			onClick={() => void publish()}
		>
			{isPublishing ? (
				<ButtonSpinner label={m['view.composer.publish.publishing']()} />
			) : (
				<ButtonText>{publishText}</ButtonText>
			)}
		</Button>
	);
}
