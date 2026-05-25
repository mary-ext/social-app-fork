import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLingui } from '@lingui/react/macro';
import { flushSync } from 'react-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { countGraphemes } from 'unicode-segmenter/grapheme';

import { MAX_DM_GRAPHEME_LENGTH } from '#/lib/constants';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';

import { useMessageDraft, useSaveMessageDraft } from '#/state/messages/message-drafts';

import { atoms as a, flatten, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import * as EmojiPicker from '#/components/EmojiPicker';
import { useSharedInputStyles } from '#/components/forms/TextField';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile } from '#/components/icons/Emoji';
import { PaperPlane_Stroke2_Corner0_Rounded as PaperPlane } from '#/components/icons/PaperPlane';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';

import { IS_WEB_SAFARI, IS_WEB_TOUCH_DEVICE } from '#/env';

import { useExtractEmbedFromFacets } from './MessageInputEmbed';

export function MessageInput({
	onSendMessage,
	hasEmbed,
	setEmbed,
	children,
	loading = false,
}: {
	onSendMessage: (message: string) => void;
	hasEmbed: boolean;
	setEmbed: (embedUrl: string | undefined) => void;
	textInputId?: string;
	children?: React.ReactNode;
	loading?: boolean;
}) {
	const { isMobile } = useWebMediaQueries();
	const { t: l } = useLingui();
	const t = useTheme();
	const { getDraft, clearDraft } = useMessageDraft();
	const [message, setMessage] = useState(getDraft);

	const inputStyles = useSharedInputStyles();
	const isComposing = useRef(false);
	const [isFocused, setIsFocused] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [textAreaHeight, setTextAreaHeight] = useState(38);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const submitDisabled = loading || (!hasEmbed && message.trim().length === 0);

	const onSubmit = useCallback(() => {
		if (loading) {
			return;
		}
		if (!hasEmbed && message.trim() === '') {
			return;
		}
		if (countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
			Toast.show(l`Message is too long`, {
				type: 'error',
			});
			return;
		}
		clearDraft();
		onSendMessage(message);
		setMessage('');
		setEmbed(undefined);
	}, [message, onSendMessage, l, clearDraft, hasEmbed, setEmbed, loading]);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (isComposing.current) return;

			if (IS_WEB_SAFARI && e.key === 'Enter' && e.keyCode === 229) {
				return;
			}

			if (e.key === 'Enter') {
				if (e.shiftKey) return;
				e.preventDefault();
				onSubmit();
			}
		},
		[onSubmit],
	);

	const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value);
	}, []);

	const onEmojiInserted = useCallback(
		(emoji: EmojiPicker.Emoji) => {
			if (!textAreaRef.current) {
				return;
			}
			const position = textAreaRef.current.selectionStart ?? 0;
			flushSync(() => {
				setMessage((message) => message.slice(0, position) + emoji.native + message.slice(position));
			});
			textAreaRef.current.selectionStart = position + emoji.native.length;
			textAreaRef.current.selectionEnd = position + emoji.native.length;
		},
		[setMessage],
	);

	useSaveMessageDraft(message);
	useExtractEmbedFromFacets(message, setEmbed);

	return (
		<View style={a.p_sm}>
			<View
				style={[
					a.flex_row,
					t.atoms.bg_contrast_25,
					{
						paddingRight: a.p_sm.padding - 2,
						paddingLeft: a.p_sm.padding - 2,
						borderWidth: 1,
						borderRadius: 23,
						borderColor: 'transparent',
						height: textAreaHeight + 23,
					},
					isHovered && inputStyles.chromeHover,
					isFocused && inputStyles.chromeFocus,
				]}
				// @ts-expect-error web only
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{children}
				{loading ? null : (
					<EmojiPicker.Root onEmojiSelect={onEmojiInserted} nextFocusRef={textAreaRef}>
						<EmojiPicker.Trigger label={l`Open emoji picker`}>
							{({ props, state }) => (
								<Button
									style={[
										a.rounded_full,
										a.overflow_hidden,
										a.align_center,
										a.justify_center,
										{
											marginTop: 5,
											height: 30,
											width: 30,
										},
									]}
									label={props.accessibilityLabel}
									{...props}
								>
									<View
										style={[
											a.absolute,
											a.inset_0,
											a.align_center,
											a.justify_center,
											{
												backgroundColor:
													state.hovered || state.focused || state.pressed
														? t.atoms.bg.backgroundColor
														: undefined,
											},
										]}
									>
										<EmojiSmile size="lg" />
									</View>
								</Button>
							)}
						</EmojiPicker.Trigger>
						<EmojiPicker.Picker />
					</EmojiPicker.Root>
				)}
				<TextareaAutosize
					ref={textAreaRef}
					style={flatten([
						a.flex_1,
						a.px_sm,
						a.border_0,
						t.atoms.text,
						{
							paddingTop: 10,
							backgroundColor: 'transparent',
							resize: 'none',
						},
					])}
					maxRows={12}
					placeholder={
						loading
							? l({ message: 'Loading chat...', context: 'placeholder' })
							: l({ message: 'Message', context: 'action' })
					}
					defaultValue=""
					value={message}
					dirName="ltr"
					disabled={loading}
					autoFocus={true}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					onCompositionStart={() => {
						isComposing.current = true;
					}}
					onCompositionEnd={() => {
						isComposing.current = false;
					}}
					onHeightChange={(height) => setTextAreaHeight(height)}
					onChange={onChange}
					onKeyDown={IS_WEB_TOUCH_DEVICE && isMobile ? undefined : onKeyDown}
				/>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={l`Send message`}
					accessibilityHint=""
					style={[
						a.rounded_full,
						a.align_center,
						a.justify_center,
						{
							height: 30,
							width: 30,
							marginTop: 5,
							backgroundColor: submitDisabled ? t.palette.contrast_100 : t.palette.primary_500,
						},
					]}
					onPress={onSubmit}
					disabled={submitDisabled}
				>
					{loading ? (
						<Loader size="md" fill={t.palette.white} style={[a.relative, { left: 1 }]} />
					) : (
						<PaperPlane fill={t.palette.white} style={[a.relative, { left: 1 }]} />
					)}
				</Pressable>
			</View>
		</View>
	);
}
