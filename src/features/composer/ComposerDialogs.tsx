import { ImageAltTextDialog } from '#/features/alt-text/ImageAltTextDialog';
import { EditImageDialog } from '#/features/image-editing/EditImageDialog';

import { useComposer } from './context';
import { setAttachmentLabels } from './labels/attachment-labels';
import { LabelsDialog } from './labels/LabelsDialog';
import { setMediaAlt } from './media/alt-text';
import { ExternalGifAltTextDialog } from './media/external-gifs/ExternalGifAltTextDialog';
import { GifAltTextDialog } from './media/gifs/GifAltTextDialog';
import { setImageEdit } from './media/images/image-edits';
import { setMediaCaptions } from './media/videos/captions';
import { CaptionsDialog } from './media/videos/CaptionsDialog';
import { VideoAltTextDialog } from './media/videos/VideoAltTextDialog';
import { VoiceAltTextDialog } from './media/voices/VoiceAltTextDialog';

/**
 * renders attachment dialogs and saves edits to the composer.
 *
 * @returns the dialogs
 */
export function ComposerDialogs() {
	const { wg, dialogs } = useComposer();

	const saveAlt = (alt: string, { mediaId }: { mediaId: string }) => {
		setMediaAlt(wg, { mediaId, alt });
	};

	return (
		<>
			<ImageAltTextDialog handle={dialogs.imageAlt} onSave={saveAlt} />
			<GifAltTextDialog handle={dialogs.gifAlt} onSave={saveAlt} />
			<ExternalGifAltTextDialog handle={dialogs.externalGifAlt} onSave={saveAlt} />
			<VideoAltTextDialog handle={dialogs.videoAlt} onSave={saveAlt} />
			<VoiceAltTextDialog handle={dialogs.voiceAlt} onSave={saveAlt} />
			<CaptionsDialog
				handle={dialogs.captions}
				onSave={(tracks, { mediaId }) => setMediaCaptions(wg, { mediaId, tracks })}
			/>
			<EditImageDialog
				handle={dialogs.editImage}
				onSave={(edit, { mediaId }) => setImageEdit(wg, { mediaId, edit })}
			/>
			<LabelsDialog
				handle={dialogs.labels}
				onSave={(labels, { keys }) => setAttachmentLabels(wg, keys, labels)}
			/>
		</>
	);
}
