import { createContext, lazy, type ReactNode, type RefObject, Suspense, useContext } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';

import { emojiInserted } from '#/features/emoji-picker/emoji-inserted';
import { useEmojiPreload } from '#/features/emoji-picker/preload';
import type { Emoji } from '#/features/emoji-picker/types';

import * as Popover from '#/components/primitives/popover';

import { m } from '#/paraglide/messages';

import { PickerPlaceholder } from './components/PickerPlaceholder';
import * as styles from './EmojiPicker.css';

const EmojiPanel = lazy(() => import('./EmojiPanel').then((mod) => ({ default: mod.EmojiPanel })));

export type { Emoji } from '#/features/emoji-picker/types';

type FocusableElement = { focus: () => void };
type NextFocusRef = RefObject<FocusableElement | null> | (() => FocusableElement | null | undefined);

const EmojiPickerContext = createContext<{
	onEmojiSelect: (emoji: Emoji) => void;
	close: () => void;
	nextFocusRef?: NextFocusRef;
} | null>(null);

export type RootProps = {
	children: ReactNode;
	/** handle shared with the detached {@link Trigger}. */
	handle: EmojiPickerHandle;
	/** receives the selected emoji; `emojiInserted` is emitted even when this callback is omitted. */
	onEmojiSelect?: (emoji: Emoji) => void;
	/** focus target on close; defaults to the trigger when omitted or empty. */
	nextFocusRef?: NextFocusRef;
};

/** trigger for a sibling {@link Root}; pass the shared `handle` and a button via `render`. */
export const Trigger = Popover.Trigger;

export type EmojiPickerHandle = Popover.Handle;

/** @returns a stable emoji picker handle for this component */
export function useEmojiPickerHandle(): EmojiPickerHandle {
	const handle = useConstant(Popover.createHandle);
	return handle;
}

/**
 * provides the emoji picker popover.
 *
 * @param props picker content, shared handle, selection callback, and focus target
 * @returns the picker content within its popover root
 */
export function Root({ children, handle, onEmojiSelect, nextFocusRef }: RootProps) {
	useEmojiPreload({ immediate: true });

	const value = {
		onEmojiSelect: (emoji: Emoji) => {
			emojiInserted.emit(emoji);
			onEmojiSelect?.(emoji);
		},
		close: () => handle.close(),
		nextFocusRef,
	};

	return (
		<EmojiPickerContext value={value}>
			<Popover.Root handle={handle} modal={true}>
				{children}
			</Popover.Root>
		</EmojiPickerContext>
	);
}

/**
 * picker panel; requires an enclosing {@link Root}.
 *
 * @returns the emoji panel
 */
export function Picker() {
	const { onEmojiSelect, close, nextFocusRef } = useEmojiPickerContext();

	return (
		<Popover.Positioner sideOffset={5} collisionPadding={5}>
			<Popover.Popup
				className={styles.popup}
				finalFocus={() => {
					if (!nextFocusRef) {
						return true;
					}
					const el = typeof nextFocusRef === 'function' ? nextFocusRef() : nextFocusRef.current;
					if (el) {
						el.focus();
						return false;
					}
					return true;
				}}
			>
				<Suspense fallback={<PickerPlaceholder />}>
					<EmojiPanel
						onEmojiSelect={(emoji, shiftHeld) => {
							onEmojiSelect(emoji);
							if (!shiftHeld) {
								close();
							}
						}}
					/>
				</Suspense>
				<Popover.Close className={styles.srOnly}>{m['common.action.close']()}</Popover.Close>
			</Popover.Popup>
		</Popover.Positioner>
	);
}

function useEmojiPickerContext() {
	const ctx = useContext(EmojiPickerContext);
	if (!ctx) {
		throw new Error('EmojiPicker.Picker must be used within an EmojiPicker.Root component');
	}
	return ctx;
}
