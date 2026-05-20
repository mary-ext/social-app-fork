import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBskyRichtextFacet, RichText } from '@atproto/api';
import { Trans } from '@lingui/react/macro';

import Animated, { FadeIn, FadeOut } from '#/lib/animations/reanimatedCompat';
import { blobToDataUri, isUriImage } from '#/lib/media/util';

import { type LinkFacetMatch, suggestLinkCardUri } from '#/view/com/composer/text-input/text-input-util';
import { textInputWebEmitter } from '#/view/com/composer/text-input/textInputWebEmitter';

import { atoms as a, useAlf } from '#/alf';

import {
	Composer as TapperComposer,
	type SubmitRequest,
	useComposerInternalApiRef,
} from '#/components/Composer';
import { type Emoji } from '#/components/EmojiPicker';
import { Portal } from '#/components/Portal';
import { Text } from '#/components/Typography';

import { type TextInputProps } from './TextInput.types';

export function TextInput({
	ref,
	richtext,
	placeholder,
	webForceMinHeight,
	hasRightPadding,
	isActive,
	setRichText,
	onPhotoPasted,
	onPressPublish,
	onNewLink,
	onError,
	onFocus,
	autoFocus,
	accessible,
	accessibilityHint,
	accessibilityLabel,
}: TextInputProps) {
	const { theme: t } = useAlf();
	const apiRef = useComposerInternalApiRef();
	const activeFacetRef = useRef(false);
	const isPastingRef = useRef(false);
	const pastSuggestedUris = useRef(new Set<string>());
	const prevDetectedUris = useRef(new Map<string, LinkFacetMatch>());
	const prevLength = useRef(richtext.text.length);
	const richtextRef = useRef(richtext);
	const [isDropping, setIsDropping] = useState(false);

	richtextRef.current = richtext;

	const handleRichTextChange = useCallback(
		(newText: string) => {
			const mayBePaste = isPastingRef.current || newText.length > prevLength.current + 1;
			isPastingRef.current = false;

			const newRt = new RichText({ text: newText });
			newRt.detectFacetsWithoutResolution();
			richtextRef.current = newRt;
			setRichText(newRt);

			const nextDetectedUris = new Map<string, LinkFacetMatch>();
			if (newRt.facets) {
				for (const facet of newRt.facets) {
					for (const feature of facet.features) {
						if (AppBskyRichtextFacet.isLink(feature)) {
							nextDetectedUris.set(feature.uri, { facet, rt: newRt });
						}
					}
				}
			}

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
		[onNewLink, setRichText],
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
			onPressPublish(richtextRef.current);
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
				label={placeholder || ''}
				placeholder={placeholder}
				defaultValue={richtext.text}
				autoFocus={autoFocus}
				accessible={accessible}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}
				minRows={webForceMinHeight ? 7 : 2}
				outerStyle={[styles.container]}
				contentTextStyle={[a.text_lg]}
				contentPaddingStyle={{
					paddingBottom: 5,
					paddingLeft: 5,
					paddingRight: hasRightPadding ? 37 : 5,
					paddingTop: 5,
				}}
				onActiveFacet={(facet) => {
					activeFacetRef.current = !!facet;
				}}
				onBlur={() => {
					activeFacetRef.current = false;
				}}
				onChange={handleRichTextChange}
				onFocus={onFocus}
				onRequestSubmit={handleRequestSubmit}
				onPaste={handlePaste}
			/>

			{isDropping && (
				<Portal>
					<Animated.View
						style={styles.dropContainer}
						entering={FadeIn.duration(80)}
						exiting={FadeOut.duration(80)}
					>
						<View style={[t.atoms.bg, t.atoms.border_contrast_low, styles.dropModal]}>
							<Text
								style={[
									a.text_lg,
									a.font_semi_bold,
									t.atoms.text_contrast_medium,
									t.atoms.border_contrast_high,
									styles.dropText,
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

const styles = StyleSheet.create({
	container: {
		alignSelf: 'flex-start',
		flex: 1,
		marginBottom: 10,
		marginLeft: 8,
	},
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
	onMedia: (uri: string) => void,
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
						blobToDataUri(blob).then(onMedia, (err) => {
							onError(String(err));
						});
					}
				} catch (err) {
					onError(String(err));
				}
			});
		} else if (type.startsWith('image/') || type.startsWith('video/')) {
			const file = item.getAsFile();

			if (file) {
				blobToDataUri(file).then(onMedia, (err) => {
					onError(String(err));
				});
			}
		}
	}
}
