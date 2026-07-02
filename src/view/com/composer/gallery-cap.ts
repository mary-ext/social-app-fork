import { useCallback } from 'react';

import type { ComposerImage } from '#/state/gallery';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { MAX_GALLERY_IMAGES, type PostAction } from './state/composer';

/** Clamps a batch of incoming images against the remaining gallery slots. Never mutates its inputs. */
export function applyGalleryCap(
	currentCount: number,
	incoming: ComposerImage[],
):
	| { status: 'full' }
	| { status: 'partial'; accepted: ComposerImage[]; dropped: number }
	| { status: 'ok'; accepted: ComposerImage[] } {
	const remaining = MAX_GALLERY_IMAGES - currentCount;
	if (remaining <= 0) {
		return { status: 'full' };
	}
	if (incoming.length > remaining) {
		return {
			status: 'partial',
			accepted: incoming.slice(0, remaining),
			dropped: incoming.length - remaining,
		};
	}
	return { status: 'ok', accepted: incoming };
}

/** Returns an adder that applies the gallery cap, toasting when the batch is fully or partially rejected. */
export function useAddImagesWithCap(currentCount: number, dispatchPostAction: (action: PostAction) => void) {
	return useCallback(
		(next: ComposerImage[]) => {
			const result = applyGalleryCap(currentCount, next);
			if (result.status === 'full') {
				Toast.show(m['view.composer.gallery.error.maxAdd']({ max: MAX_GALLERY_IMAGES }), { type: 'warning' });
				return;
			}
			if (result.status === 'partial') {
				Toast.show(
					m['view.composer.gallery.error.limit']({
						accepted: result.accepted.length,
						count: next.length,
						total: next.length,
						max: MAX_GALLERY_IMAGES,
					}),
					{ type: 'warning' },
				);
			}
			dispatchPostAction({
				type: 'embed_add_images',
				images: result.accepted,
			});
		},
		[currentCount, dispatchPostAction],
	);
}
