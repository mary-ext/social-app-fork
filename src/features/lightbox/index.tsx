import { lazy, Suspense, useState } from 'react';

import * as Dialog from '#/components/Dialog';
import { lightboxHandle, type LightboxPayload } from '#/components/dialogs/handles';
import * as BaseDialog from '#/components/primitives/dialog';

import { m } from '#/paraglide/messages';

import * as styles from './Lightbox.css';
import { LightboxLoading } from './LightboxLoading';

const importLightboxContents = () =>
	import('./LightboxContents').then((mod) => ({ default: mod.LightboxContents }));

const LightboxContents = lazy(importLightboxContents);

export function preloadLightbox() {
	void importLightboxContents();
}

export function Lightbox() {
	const [open, setOpen] = useState(false);
	return (
		<Dialog.Root handle={lightboxHandle} onOpenChange={(next) => setOpen(next)}>
			{({ payload }: { payload: LightboxPayload | undefined }) =>
				payload ? (
					<BaseDialog.Viewport>
						<BaseDialog.Backdrop className={styles.backdrop} />
						<BaseDialog.Popup aria-label={m['components.lightbox.a11y.viewer']()} className={styles.popup}>
							<Suspense fallback={<LightboxLoading size="xl" />}>
								<LightboxContents payload={payload} open={open} close={() => lightboxHandle.close()} />
							</Suspense>
						</BaseDialog.Popup>
					</BaseDialog.Viewport>
				) : null
			}
		</Dialog.Root>
	);
}
