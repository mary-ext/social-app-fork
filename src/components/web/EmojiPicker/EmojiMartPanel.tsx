import { lazy, Suspense, useEffect, useRef } from 'react';

import type { Emoji } from '#/components/EmojiPicker/types';
import { Loader_Stroke2_Corner0_Rounded as LoaderIcon } from '#/components/icons/Loader';

import * as styles from './EmojiPicker.css';

const EmojiMartPicker = lazy(() => import('@emoji-mart/react'));

/** Stand-in shown while the lazily-loaded emoji-mart chunk downloads (sized to the emoji-mart panel). */
function PickerPlaceholder() {
	return (
		<div className={styles.placeholder}>
			<span className={styles.spinner}>
				<LoaderIcon size="3xl" fill="currentColor" />
			</span>
		</div>
	);
}

/**
 * The lazily-loaded emoji-mart panel (brings its own surface chrome). Reports each selection plus whether
 * Shift was held when it was made, so callers can implement multi-select (keep open while Shift is down).
 */
export function EmojiMartPanel({
	onEmojiSelect,
}: {
	onEmojiSelect: (emoji: Emoji, shiftHeld: boolean) => void;
}) {
	const isShiftDown = useRef(false);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') isShiftDown.current = true;
		};
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Shift') isShiftDown.current = false;
		};
		window.addEventListener('keydown', onKeyDown, true);
		window.addEventListener('keyup', onKeyUp, true);
		return () => {
			window.removeEventListener('keydown', onKeyDown, true);
			window.removeEventListener('keyup', onKeyUp, true);
		};
	}, []);

	return (
		<Suspense fallback={<PickerPlaceholder />}>
			<EmojiMartPicker
				autoFocus
				onEmojiSelect={(emoji: Emoji) => onEmojiSelect(emoji, isShiftDown.current)}
			/>
		</Suspense>
	);
}
