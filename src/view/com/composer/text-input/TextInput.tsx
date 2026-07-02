import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { isUriImage } from '#/lib/media/util';

import {
	detectLinks,
	type LinkFacetMatch,
	suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util';
import { emojiInserted } from '#/view/com/composer/text-input/textInputWebEmitter';

import {
	Composer as TapperComposer,
	type SubmitRequest,
	useComposerInternalApiRef,
} from '#/components/Composer';
import type { Emoji } from '#/components/EmojiPicker';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './TextInput.css';
import type { TextInputProps } from './TextInput.types';

export function TextInput({
	ref,
	text,
	placeholder,
	forceMinHeight,
	hasRightPadding,
	isActive,
	setText,
	onPhotoPasted,
	onPressPublish,
	onNewLink,
	onError,
	onFocus,
	autoFocus,
	accessibilityHint,
	accessibilityLabel,
}: TextInputProps) {
	const apiRef = useComposerInternalApiRef();
	const activeCompletionRef = useRef(false);
	const isPastingRef = useRef(false);
	const pastSuggestedUris = useRef(new Set<string>());
	const prevDetectedUris = useRef(new Map<string, LinkFacetMatch>());
	const prevLength = useRef(text.length);
	const textRef = useRef(text);
	const [isDropping, setIsDropping] = useState(false);

	useEffect(() => {
		textRef.current = text;
	});

	const handleTextChange = (newText: string) => {
		const mayBePaste = isPastingRef.current || newText.length > prevLength.current + 1;
		isPastingRef.current = false;

		textRef.current = newText;
		setText(newText);

		const nextDetectedUris = detectLinks(newText);
		const suggestedUri = suggestLinkCardUri(
			mayBePaste,
			nextDetectedUris,
			prevDetectedUris.current,
			pastSuggestedUris.current,
		);
		prevDetectedUris.current = nextDetectedUris;
		prevLength.current = newText.length;
		if (suggestedUri) {
			onNewLink(suggestedUri);
		}
	};

	const onEmojiInserted = useCallback(
		(emoji: Emoji) => {
			apiRef.current?.insert(emoji.native);
		},
		[apiRef],
	);

	useEffect(() => {
		if (!isActive) {
			return;
		}
		return emojiInserted.subscribe(onEmojiInserted);
	}, [isActive, onEmojiInserted]);

	useEffect(() => {
		if (!isActive) {
			return;
		}

		const handleDrop = (event: DragEvent) => {
			const transfer = event.dataTransfer;
			if (transfer) {
				handleTransferItems(transfer.items, onPhotoPasted, onError);
			}

			event.preventDefault();
			setIsDropping(false);
		};
		const handleDragEnter = (event: DragEvent) => {
			const transfer = event.dataTransfer;

			event.preventDefault();
			if (transfer && transfer.types.includes('Files')) {
				setIsDropping(true);
			}
		};
		const handleDragLeave = (event: DragEvent) => {
			event.preventDefault();
			setIsDropping(false);
		};

		document.body.addEventListener('drop', handleDrop);
		document.body.addEventListener('dragenter', handleDragEnter);
		document.body.addEventListener('dragover', handleDragEnter);
		document.body.addEventListener('dragleave', handleDragLeave);

		return () => {
			document.body.removeEventListener('drop', handleDrop);
			document.body.removeEventListener('dragenter', handleDragEnter);
			document.body.removeEventListener('dragover', handleDragEnter);
			document.body.removeEventListener('dragleave', handleDragLeave);
		};
	}, [isActive, onError, onPhotoPasted]);

	useImperativeHandle(ref, () => ({
		focus: () => {
			apiRef.current?.input?.focus();
		},
		blur: () => {
			apiRef.current?.input?.blur();
		},
		getCursorPosition: () => undefined,
		maybeClosePopup: () => {
			if (!activeCompletionRef.current) {
				return false;
			}
			apiRef.current?.input?.blur();
			activeCompletionRef.current = false;
			return true;
		},
	}));

	const handleRequestSubmit = (request: SubmitRequest) => {
		if (request.platform === 'web') {
			const nativeEvent = request.nativeEvent;
			if (!request.metaKey && !nativeEvent.ctrlKey) {
				return;
			}
			nativeEvent.preventDefault();
		}
		onPressPublish(textRef.current);
	};

	const handlePaste = (event: ClipboardEvent) => {
		isPastingRef.current = true;
		window.setTimeout(() => {
			isPastingRef.current = false;
		}, 0);
		const transfer = event.clipboardData;
		if (transfer?.items) {
			if (hasMediaTransfer(transfer)) {
				event.preventDefault();
			}
			handleTransferItems(transfer.items, onPhotoPasted, onError);
		}
	};

	return (
		<>
			<TapperComposer
				internalApiRef={apiRef}
				placeholder={placeholder}
				defaultValue={text}
				autoFocus={autoFocus}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}
				minRows={forceMinHeight ? 6 : 2}
				className={styles.editor}
				contentPadding={{
					top: 6,
					bottom: 6,
					left: 0,
					right: hasRightPadding ? 24 : 0,
				}}
				onActiveCompletion={(completion) => {
					activeCompletionRef.current = !!completion;
				}}
				onBlur={() => {
					activeCompletionRef.current = false;
				}}
				onChange={handleTextChange}
				onFocus={onFocus}
				onRequestSubmit={handleRequestSubmit}
				onPaste={handlePaste}
			/>

			{createPortal(
				<div className={styles.dropScrim({ visible: isDropping })} inert={!isDropping}>
					<div className={styles.dropCard}>
						<Text className={styles.dropText} color="textContrastMedium" size="lg" weight="semiBold">
							{m['view.composer.gallery.dropToAdd']()}
						</Text>
					</div>
				</div>,
				document.body,
			)}
		</>
	);
}

function hasMediaTransfer(transfer: DataTransfer) {
	const items = transfer.items;
	for (let index = 0; index < items.length; index++) {
		const type = items[index]!.type;

		if (type.startsWith('image/') || type.startsWith('video/')) {
			return true;
		}
	}

	return isUriImage(transfer.getData('text/plain'));
}

function handleTransferItems(
	items: DataTransferItemList,
	onMedia: (blob: Blob) => void,
	onError: (err: string) => void,
) {
	for (let index = 0; index < items.length; index++) {
		const item = items[index]!;
		const type = item.type;

		if (type === 'text/plain') {
			item.getAsString(
				(itemString) =>
					void (async () => {
						if (!isUriImage(itemString)) {
							return;
						}

						try {
							const response = await fetch(itemString);
							const blob = await response.blob();

							if (blob.type.startsWith('image/') || blob.type.startsWith('video/')) {
								onMedia(blob);
							}
						} catch (err) {
							onError(String(err));
						}
					})(),
			);
		} else if (type.startsWith('image/') || type.startsWith('video/')) {
			const file = item.getAsFile();

			if (file) {
				onMedia(file);
			}
		}
	}
}
