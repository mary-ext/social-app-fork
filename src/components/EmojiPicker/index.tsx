import { createContext, type ReactNode, type RefObject, useContext, useRef } from 'react';

import { Popover } from '@base-ui/react/popover';

import { useConstant } from '#/lib/hooks/use-constant';

import { emojiInserted } from '#/view/com/composer/text-input/textInputWebEmitter';

import { useWebPreloadEmoji } from '#/components/EmojiPicker/preload';
import type { Emoji } from '#/components/EmojiPicker/types';

import { EmojiPanel } from './EmojiPanel';
import * as styles from './EmojiPicker.css';

export type { Emoji } from '#/components/EmojiPicker/types';

type FocusableElement = { focus: () => void };
type NextFocusRef = RefObject<FocusableElement | null> | (() => FocusableElement | null | undefined);

const EmojiPickerContext = createContext<{
	onEmojiSelect: (emoji: Emoji) => void;
	close: () => void;
	nextFocusRef?: NextFocusRef;
} | null>(null);

export type RootProps = {
	children: ReactNode;
	/** Detached handle linking the {@link Trigger} to this Root (see Base UI Popover detached triggers). */
	handle: EmojiPickerHandle;
	/**
	 * Called when the user selects an emoji. Fires in addition to the `emojiInserted` event, so callers that
	 * only need the text insertion can omit it.
	 */
	onEmojiSelect?: (emoji: Emoji) => void;
	/** Preload emoji data on mount so the picker opens instantly. Defaults to `true`. */
	preloadOnMount?: boolean;
	/** Element to return focus to when the picker closes (instead of the trigger). Ref or getter. */
	nextFocusRef?: NextFocusRef;
};

/** The trigger button (a sibling of {@link Root}). Pass a web `Button` via `render` + the shared `handle`. */
export const Trigger = Popover.Trigger;

/** Creates a detached handle to associate a {@link Trigger} with a {@link Root} / open-close imperatively. */
const createHandle = Popover.createHandle;

/** A detached handle for the emoji picker popover. */
export type EmojiPickerHandle = Popover.Handle<void>;

/** Component-local emoji-picker handle. */
export function useEmojiPickerHandle(): EmojiPickerHandle {
	const handle = useConstant(createHandle<void>);
	return handle;
}

/**
 * emoji picker that opens in a popover. emits an `emojiInserted` event and triggers the optional
 * `onEmojiSelect` callback when an emoji is selected.
 */
export function Root({ children, handle, onEmojiSelect, preloadOnMount = true, nextFocusRef }: RootProps) {
	useWebPreloadEmoji({ immediate: preloadOnMount });
	// close via the Root's own actions; `handle.close()` only affects popovers opened through `handle.open()`,
	// not ones opened by clicking the Trigger.
	const actionsRef = useRef<{ close: () => void; unmount: () => void }>(null);

	const value = {
		onEmojiSelect: (emoji: Emoji) => {
			emojiInserted.emit(emoji);
			onEmojiSelect?.(emoji);
		},
		close: () => actionsRef.current?.close(),
		nextFocusRef,
	};

	return (
		<EmojiPickerContext value={value}>
			<Popover.Root handle={handle} actionsRef={actionsRef} modal={true}>
				{children}
			</Popover.Root>
		</EmojiPickerContext>
	);
}

export type PickerProps = {
	/** Keep the picker open after selecting while Shift is held (multi-select). Defaults to `true`. */
	keepOpenWhenShiftHeld?: boolean;
};

/** The picker panel. Must be rendered inside a {@link Root}. */
export function Picker({ keepOpenWhenShiftHeld = true }: PickerProps) {
	const { onEmojiSelect, close, nextFocusRef } = useEmojiPickerContext();

	return (
		<Popover.Portal>
			<Popover.Positioner className={styles.positioner} sideOffset={5} collisionPadding={5}>
				<Popover.Popup
					className={styles.popup}
					// return focus to the caller's target (e.g. the composer text input) rather than the trigger
					finalFocus={() => {
						if (!nextFocusRef) return;
						const el = nextFocusRef instanceof Function ? nextFocusRef() : nextFocusRef.current;
						if (el) {
							el.focus();
							return false;
						}
					}}
					// keep the picker's internal scroll from bubbling to the dialog behind it
					onWheel={(e) => e.stopPropagation()}
				>
					<EmojiPanel
						onEmojiSelect={(emoji, shiftHeld) => {
							onEmojiSelect(emoji);
							if (!keepOpenWhenShiftHeld || !shiftHeld) {
								close();
							}
						}}
					/>
				</Popover.Popup>
			</Popover.Positioner>
		</Popover.Portal>
	);
}

function useEmojiPickerContext() {
	const ctx = useContext(EmojiPickerContext);
	if (!ctx) throw new Error('EmojiPicker.Picker must be used within an EmojiPicker.Root component');
	return ctx;
}
