import { type ReactNode, useEffect, useEffectEvent } from 'react';

import { ThreadgateBtn } from '#/features/composer/threadgate/ThreadgateBtn';

import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { useComposer, useIsPublishing, usePostCount, useThreadInteraction } from '../context';
import { useUploadsProgress } from '../media/shared/upload-status';
import { usePublish } from '../publish/use-publish';
import { AltTextPrompt, useAltTextGuard } from './AltTextPrompt';
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
	const isPublishing = useIsPublishing();

	return <ThreadgateBtn value={settings} disabled={isPublishing} onChange={interaction.set} />;
}

const NO_FILES: readonly File[] = [];

function PublishButton() {
	const { handlePublishKey } = useComposer();
	const altGuard = useAltTextGuard();
	const { blocker, task, publish } = usePublish();
	const uploadPercent = useUploadsProgress(task?.videos ?? NO_FILES);
	const isThread = usePostCount() > 1;
	const publishLabel = isThread
		? m['view.composer.publish.a11y.posts']()
		: m['view.composer.publish.a11y.post']();
	const publishText = isThread ? m['view.composer.publish.action.all']() : m['navigation.post.title']();

	// a blocked thread shouldn't prompt; publish re-checks the live state.
	const requestPublish = () => {
		if (blocker === null && task === null && !altGuard.intercept()) {
			void publish();
		}
	};

	const onPublishKey = useEffectEvent(requestPublish);
	useEffect(() => {
		return handlePublishKey(onPublishKey);
	}, [handlePublishKey]);

	let content: ReactNode;
	if (task === null) {
		content = <ButtonText>{publishText}</ButtonText>;
	} else {
		content = (
			<>
				<ButtonSpinner label={m['view.composer.publish.publishing']()} />
				{uploadPercent !== null && (
					<ButtonText>{m['view.composer.media.upload.uploading']({ percent: uploadPercent })}</ButtonText>
				)}
			</>
		);
	}

	return (
		<>
			{task !== null && uploadPercent !== null && (
				<Button color="secondary" size="small" label={`Cancel publishing`} onClick={task.cancel}>
					<ButtonText>{m['common.action.cancel']()}</ButtonText>
				</Button>
			)}

			<Button
				color="primary"
				size="small"
				label={publishLabel}
				disabled={blocker !== null || task !== null}
				onClick={requestPublish}
			>
				{content}
			</Button>

			<AltTextPrompt {...altGuard.prompt} onProceed={() => void publish()} />
		</>
	);
}
