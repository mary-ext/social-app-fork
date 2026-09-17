import { lazy, Suspense } from 'react';

import type { Gif } from '#/lib/media/external-gif/types';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

const GifPickerDialogContent = lazy(() =>
	import('./GifPickerDialogContent').then((mod) => ({ default: mod.GifPickerDialogContent })),
);

export function GifPickerDialog({
	handle,
	onClose,
	onSelectGif,
}: {
	handle: Dialog.DialogHandle;
	onClose?: () => void;
	onSelectGif: (gif: Gif) => void;
}) {
	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open) => {
				if (!open) {
					onClose?.();
				}
			}}
		>
			<Dialog.Popup height="fixed" label={m['features.gifPicker.title']()} scroll="body" size="wide">
				<Suspense fallback={<CenteredSpinner fill label={m['common.status.loading']()} size="xl" />}>
					<GifPickerDialogContent handle={handle} onSelectGif={onSelectGif} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
