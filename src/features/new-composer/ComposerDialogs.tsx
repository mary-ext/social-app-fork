import { ImageAltTextDialog } from '#/features/composer/photos/ImageAltTextDialog';

import { EditImageDialog } from '#/components/EditImageDialog/EditImageDialog';

import { useComposer } from './context';
import { setAttachmentLabels } from './labels/commands';
import { LabelsDialog } from './labels/LabelsDialog';
import { ExternalGifAltTextDialog } from './media/external-gifs/ExternalGifAltTextDialog';
import { GifAltTextDialog } from './media/gifs/GifAltTextDialog';
import { setImageEdit } from './media/images/image-edits';
import { setMediaAlt } from './media/shared/alt-text';
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
