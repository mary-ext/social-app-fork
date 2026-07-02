import { LabelsBtn } from '#/view/com/composer/labels/LabelsBtn';

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
	const hasMedia =
		media?.type === 'images' || media?.type === 'gallery' || media?.type === 'gif' || media?.type === 'video';
	const hasLink = !!post.embed.link;

	// Don't render anything if no pills are going to be displayed
	if (isReply && !hasMedia && !hasLink) {
		return null;
	}

	return (
		<div className={styles.pills}>
			{isReply ? null : (
				<ThreadgateBtn
					postgate={thread.postgate}
					onChangePostgate={(nextPostgate) => {
						dispatch({ type: 'update_postgate', postgate: nextPostgate });
					}}
					threadgateAllowUISettings={thread.threadgate}
					onChangeThreadgateAllowUISettings={(nextThreadgate) => {
						dispatch({
							type: 'update_threadgate',
							threadgate: nextThreadgate,
						});
					}}
				/>
			)}
			{hasMedia || hasLink ? (
				<LabelsBtn
					labels={post.labels}
					onChange={(nextLabels) => {
						dispatch({
							type: 'update_post',
							postId: post.id,
							postAction: {
								type: 'update_labels',
								labels: nextLabels,
							},
						});
					}}
				/>
			) : null}
		</div>
	);
}
