import { lazy, type ReactNode, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

import type { CaptionTrack } from './captions';

const CaptionsDialogBody = lazy(() =>
	import('./CaptionsDialogBody').then((mod) => ({ default: mod.CaptionsDialogBody })),
);

/** captions dialog payload. */
export type VideoCaptionsTarget = {
	tracks: readonly CaptionTrack[];
};

/**
 * manages a video's caption files.
 *
 * @param props.handle opens the dialog with the video's saved caption tracks
 * @param props.onSave receives the edited tracks and original payload
 * @returns the dialog
 */
export const CaptionsDialog = <T extends VideoCaptionsTarget>({
	handle,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (tracks: readonly CaptionTrack[], target: T) => void;
}): ReactNode => {
	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" size="medium">
					{payload && (
						<Suspense fallback={<Dialog.Loading minHeight={194} />}>
							<CaptionsDialogBody
								initialTracks={payload.tracks}
								onSave={(tracks) => {
									onSave(tracks, payload);
									handle.close();
								}}
							/>
						</Suspense>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
};
