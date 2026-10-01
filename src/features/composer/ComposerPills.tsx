import { LabelsBtn } from '#/features/composer/labels/LabelsBtn';

import * as styles from './ComposerPills.css';
import type { ComposerAction, PostDraft, ThreadDraft } from './state/composer';
import { ThreadgateBtn } from './threadgate/ThreadgateBtn';

export function ComposerPills({
	isReply,
	thread,
	post,
	dispatch,
}: {
	isReply: boolean;
	thread: ThreadDraft;
	post: PostDraft;
	dispatch: (action: ComposerAction) => void;
}) {
	const media = post.embed.media;
	const hasMedia = media !== undefined;
	const hasLink = !!post.embed.link;

	// Don't render anything if no pills are going to be displayed
	if (isReply && !hasMedia && !hasLink) {
		return null;
	}

	return (
		<div className={styles.pills}>
			{isReply ? null : (
				<ThreadgateBtn
					value={thread.interaction}
					onChange={(interaction) => {
						dispatch({ type: 'updateInteraction', interaction });
					}}
				/>
			)}
			{hasMedia || hasLink ? (
				<LabelsBtn
					labels={post.labels}
					onChange={(nextLabels) => {
						dispatch({
							type: 'updatePost',
							postId: post.id,
							postAction: {
								type: 'updateLabels',
								labels: nextLabels,
							},
						});
					}}
				/>
			) : null}
		</div>
	);
}
