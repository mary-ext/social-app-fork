import { lazy, type ReactNode, Suspense } from 'react';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';

import * as Dialog from '#/components/Dialog';

import type { AltTextContext } from './generator/types';

const ImageAltTextDialogBody = lazy(() =>
	import('./ImageAltTextDialogBody').then((mod) => ({ default: mod.ImageAltTextDialogBody })),
);

/** image data passed through the alt text dialog's handle. */
export type ImageAltTextTarget = {
	/** post text and sibling alt text for description generation. */
	context: AltTextContext;
	file: Blob;
	/** initial alt text; empty when absent. */
	alt: string;
};

type Props<T extends ImageAltTextTarget> = {
	handle: Dialog.DialogHandle<T>;
	/** receives trimmed alt text and the opening payload on save. */
	onSave: (alt: string, target: T) => void;
};

export const ImageAltTextDialog = <T extends ImageAltTextTarget>({ handle, onSave }: Props<T>): ReactNode => {
	const { gtMobile } = useBreakpoints();

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" size={gtMobile ? 'xwide' : 'default'} initialFocus={false}>
					{payload && (
						<Suspense fallback={<Dialog.Loading minHeight={595} />}>
							<ImageAltTextDialogBody
								target={payload}
								onSave={(alt) => {
									onSave(alt, payload);
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
