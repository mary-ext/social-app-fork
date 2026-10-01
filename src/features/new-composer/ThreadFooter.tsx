import { useState } from 'react';

import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { createPostgateRecord, PLACEHOLDER_POST_URI } from '#/state/queries/postgate/util';
import { usePreferencesQuery } from '#/state/queries/preferences';
import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';
import { threadgateRecordToAllowUISetting } from '#/state/queries/threadgate/util';

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
	const { data: preferences } = usePreferencesQuery();

	// follow account defaults until edited, including preferences loaded after mount.
	const [editedPostgate, setEditedPostgate] = useState<AppBskyFeedPostgate.Main | null>(null);
	const [editedThreadgate, setEditedThreadgate] = useState<ThreadgateAllowUISetting[] | null>(null);

	const postgate =
		editedPostgate ??
		createPostgateRecord({
			post: PLACEHOLDER_POST_URI,
			embeddingRules: preferences?.postInteractionSettings.postgateEmbeddingRules ?? [],
		});
	const threadgate =
		editedThreadgate ??
		threadgateRecordToAllowUISetting({ allow: preferences?.postInteractionSettings.threadgateAllowRules });

	return (
		<div className={styles.root}>
			<div className={styles.start}>
				<InteractionSettingsButton
					postgate={postgate}
					onChangePostgate={setEditedPostgate}
					threadgate={threadgate}
					onChangeThreadgate={setEditedThreadgate}
				/>
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
