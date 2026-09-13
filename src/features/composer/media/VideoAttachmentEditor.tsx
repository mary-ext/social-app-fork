import type { PostAction } from '#/features/composer/state/composer';
import type { VideoState } from '#/features/composer/state/video';
import { SubtitleDialogBtn } from '#/features/composer/videos/SubtitleDialog';
import { VideoPreview } from '#/features/composer/videos/VideoPreview';
import { VoicePreview } from '#/features/composer/videos/VoicePreview';

import * as styles from './VideoAttachmentEditor.css';

/**
 * previews a post's video, GIF, or voice clip with its alt text and captions controls.
 *
 * @param props.avatar the posting account's avatar URL, if any
 * @param props.dispatch dispatches actions to the post
 * @param props.onClear removes the attachment
 * @param props.video the attachment's state
 * @returns the attachment editor
 */
export function VideoAttachmentEditor({
	avatar,
	dispatch,
	onClear,
	video,
}: {
	avatar: string | undefined;
	dispatch: (action: PostAction) => void;
	onClear: () => void;
	video: VideoState;
}) {
	const { signal } = video.abortController;

	return (
		<div className={styles.container}>
			{video.source.type === 'voice' ? (
				<VoicePreview
					asset={video.source.asset}
					avatar={avatar}
					background={video.source.background}
					clear={onClear}
				/>
			) : (
				<VideoPreview asset={video.source.asset} clear={onClear} />
			)}
			<SubtitleDialogBtn
				defaultAltText={video.altText}
				saveAltText={(altText) => {
					dispatch({ type: 'embedUpdateVideo', videoAction: { type: 'updateAltText', altText, signal } });
				}}
				captions={video.captions}
				setCaptions={(updater) => {
					dispatch({ type: 'embedUpdateVideo', videoAction: { type: 'updateCaptions', updater, signal } });
				}}
			/>
		</div>
	);
}
