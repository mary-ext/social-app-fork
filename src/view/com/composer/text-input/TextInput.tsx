import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans } from '@lingui/react/macro';

import Animated, { FadeIn, FadeOut } from '#/lib/animations/reanimatedCompat';
import { isUriImage } from '#/lib/media/util';

import {
	detectLinks,
	type LinkFacetMatch,
	suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util';
import { textInputWebEmitter } from '#/view/com/composer/text-input/textInputWebEmitter';

import { atoms as a, useAlf } from '#/alf';

import { Portal } from '#/components/Portal';
import { Text } from '#/components/Typography';
import {
	Composer as TapperComposer,
	type SubmitRequest,
	useComposerInternalApiRef,
} from '#/components/web/Composer';
import type { Emoji } from '#/components/web/EmojiPicker';

import * as styles from './TextInput.css';
import type { TextInputProps } from './TextInput.types';

export function TextInput({
	ref,
	text,
	placeholder,
	webForceMinHeight,
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
	const { theme: t } = useAlf();
	const apiRef = useComposerInternalApiRef();
	const activeFacetRef = useRef(false);
	const isPastingRef = useRef(false);
	const pastSuggestedUris = useRef(new Set<string>());
	const prevDetectedUris = useRef(new Map<string, LinkFacetMatch>());
	const prevLength = useRef(text.length);
	const textRef = useRef(text);
	const [isDropping, setIsDropping] = useState(false);

	textRef.current = text;

	const handleTextChange = useCallback(
		(newText: string) => {
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
		},
		[onNewLink, setText],
	);

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
		textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted);
		return () => {
			textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted);
		};
	}, [isActive, onEmojiInserted]);

	useEffect(() => {
		if (!isActive) {
			return;
		}
		textInputWebEmitter.addListener('media-pasted', onPhotoPasted);
		return () => {
			textInputWebEmitter.removeListener('media-pasted', onPhotoPasted);
		};
	}, [isActive, onPhotoPasted]);

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
			if (!activeFacetRef.current) {
				return false;
			}
			apiRef.current?.input?.blur();
			activeFacetRef.current = false;
			return true;
		},
	}));

	const handleRequestSubmit = useCallback(
		(request: SubmitRequest) => {
			if (request.platform === 'web') {
				const nativeEvent = request.nativeEvent;
				if (!request.metaKey && !nativeEvent.ctrlKey) {
					return;
				}
				nativeEvent.preventDefault();
			}
			onPressPublish(textRef.current);
		},
		[onPressPublish],
	);

	const handlePaste = useCallback(
		(event: ClipboardEvent) => {
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
		},
		[onError, onPhotoPasted],
	);

	return (
		<>
			<TapperComposer
				internalApiRef={apiRef}
				placeholder={placeholder}
				defaultValue={text}
				autoFocus={autoFocus}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}
				minRows={webForceMinHeight ? 7 : 2}
				className={styles.editor}
				contentPadding={{
					bottom: 5,
					left: 5,
					right: hasRightPadding ? 37 : 5,
					top: 5,
				}}
				onActiveFacet={(facet) => {
					activeFacetRef.current = !!facet;
				}}
				onBlur={() => {
					activeFacetRef.current = false;
				}}
				onChange={handleTextChange}
				onFocus={onFocus}
				onRequestSubmit={handleRequestSubmit}
				onPaste={handlePaste}
			/>

			{isDropping && (
				<Portal>
					<Animated.View
						style={dropStyles.dropContainer}
						entering={FadeIn.duration(80)}
						exiting={FadeOut.duration(80)}
					>
						<View style={[t.atoms.bg, t.atoms.border_contrast_low, dropStyles.dropModal]}>
							<Text
								style={[
									a.text_lg,
									a.font_semi_bold,
									t.atoms.text_contrast_medium,
									t.atoms.border_contrast_high,
									dropStyles.dropText,
								]}
							>
								<Trans>Drop to add images</Trans>
							</Text>
						</View>
					</Animated.View>
				</Portal>
			)}
		</>
	);
}

const dropStyles = StyleSheet.create({
	dropContainer: {
		alignItems: 'center',
		backgroundColor: '#0007',
		bottom: 0,
		justifyContent: 'center',
		left: 0,
		padding: 16,
		pointerEvents: 'none',
		// @ts-ignore web only
		position: 'fixed',
		right: 0,
		top: 0,
	},
	dropModal: {
		borderRadius: 16,
		borderWidth: 1,
		// @ts-ignore web only
		boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
		padding: 8,
	},
	dropText: {
		borderRadius: 8,
		borderStyle: 'dashed',
		borderWidth: 2,
		paddingHorizontal: 36,
		paddingVertical: 44,
	},
});

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
			item.getAsString(async (itemString) => {
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
			});
		} else if (type.startsWith('image/') || type.startsWith('video/')) {
			const file = item.getAsFile();

			if (file) {
				onMedia(file);
			}
		}
	}
}
