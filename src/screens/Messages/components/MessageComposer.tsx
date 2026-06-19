import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';
import { useLingui } from '@lingui/react/macro';
import { countGraphemes } from 'unicode-segmenter/grapheme';

import { HITSLOP_10, MAX_DM_GRAPHEME_LENGTH } from '#/lib/constants';
import { isBskyChatInviteUrl, isBskyPostUrl } from '#/lib/strings/url-helpers';

import { useMessageDraft, useSaveMessageDraft } from '#/state/messages/message-drafts';

import { atoms as a, tokens, useTheme, utils } from '#/alf';

import { Composer, useComposerInternalApiRef } from '#/components/Composer';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import * as EmojiPicker from '#/components/EmojiPicker';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import { PaperPlaneVertical_Filled_Stroke2_Corner1_Rounded as PaperPlaneIcon } from '#/components/icons/PaperPlane';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';

import { LinearGradient } from '#/shims/linear-gradient';

import * as styles from './MessageComposer.css';

const MIN_HEIGHT = 40;

export function MessageComposer({
	textInputId,
	onSendMessage,
	hasEmbed,
	setEmbed,
	children,
	loading = false,
}: {
	textInputId?: string;
	onSendMessage: (message: string, replyTo?: $type.enforce<ChatBskyConvoDefs.MessageView>) => void;
	hasEmbed: boolean;
	setEmbed: (embedUrl: string | undefined) => void;
	children?: React.ReactNode;
	loading?: boolean;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { getDraft, clearDraft } = useMessageDraft();
	const composerInternalApiRef = useComposerInternalApiRef();
	const emojiPickerHandle = EmojiPicker.useEmojiPickerHandle();
	const { replyTo, clearReply } = useMessageReplies();

	const [text, setText] = useState(getDraft);
	useSaveMessageDraft(text);

	useEffect(() => {
		if (!replyTo) return;
		composerInternalApiRef.current?.input?.focus();
	}, [replyTo, composerInternalApiRef]);

	const submitDisabled = loading || (!hasEmbed && text.trim().length === 0);

	const onSubmit = (message: string, replyTo: ChatBskyConvoDefs.MessageView | null) => {
		if (loading) return;
		if (!hasEmbed && message.trim() === '') return;
		const graphemeCount = countGraphemes(message);
		if (graphemeCount > MAX_DM_GRAPHEME_LENGTH) {
			Toast.show(l`Message is too long (${graphemeCount}/${MAX_DM_GRAPHEME_LENGTH})`, { type: 'error' });
			return;
		}

		clearDraft();
		setEmbed(undefined);
		clearReply();
		composerInternalApiRef.current?.clear();

		composerInternalApiRef.current?.input?.focus();

		requestAnimationFrame(() => {
			onSendMessage(message, replyTo ? { ...replyTo, $type: 'chat.bsky.convo.defs#messageView' } : undefined);
		});
	};

	const handleSubmit = () => {
		onSubmit(text, replyTo);
	};

	const handleChange = (nextText: string) => {
		setText(nextText);
	};

	return (
		<ComposerContainer>
			<View collapsable={false} ref={undefined}>
				<View style={[a.w_full, a.flex_row, a.gap_sm, a.align_end]}>
					<View style={[t.atoms.bg_contrast_50, a.flex_1, a.rounded_xl, { minHeight: MIN_HEIGHT }]}>
						{children}
						<View style={[a.flex_1]}>
							{loading ? null : (
								<>
									<EmojiPicker.Trigger
										handle={emojiPickerHandle}
										render={
											<button
												type="button"
												aria-label={l`Open emoji picker`}
												className={styles.emojiButton}
											/>
										}
									>
										<EmojiSmileIcon size="md" fill="currentColor" />
									</EmojiPicker.Trigger>
									<EmojiPicker.Root
										handle={emojiPickerHandle}
										onEmojiSelect={(emoji) => composerInternalApiRef.current?.insert(emoji.native)}
										nextFocusRef={() => composerInternalApiRef.current?.input?.element}
									>
										<EmojiPicker.Picker />
									</EmojiPicker.Root>
								</>
							)}
							<Composer
								nativeID={textInputId}
								label={l`Message input field`}
								placeholder={
									loading
										? l({ message: 'Loading chat...', context: 'placeholder' })
										: l({ message: 'Message', context: 'action' })
								}
								autocompletePlacement="top-start"
								internalApiRef={composerInternalApiRef}
								defaultValue={text}
								editable={!loading}
								autoFocus={true}
								maxRows={12}
								outerStyle={[a.flex_1]}
								contentTextStyle={[a.text_md, a.leading_snug]}
								contentPaddingStyle={{
									paddingLeft: 16,
									paddingTop: 10,
									paddingBottom: 10,
									paddingRight: 16 + 20,
								}}
								onChange={handleChange}
								onFacetCommitted={(facet) => {
									if (
										facet.type === 'url' &&
										(isBskyPostUrl(facet.value) || isBskyChatInviteUrl(facet.value))
									) {
										setEmbed(facet.value);
									}
								}}
								onRequestSubmit={(req) => {
									if (req.platform === 'web' && req.shiftKey) return;
									req.nativeEvent.preventDefault();
									handleSubmit();
								}}
							/>
						</View>
					</View>
					<SubmitButton onPress={handleSubmit} disabled={submitDisabled} loading={loading} />
				</View>
			</View>
		</ComposerContainer>
	);
}

function SubmitButton({
	onPress,
	disabled,
	loading,
}: {
	onPress: () => void;
	disabled: boolean;
	loading: boolean;
}) {
	const { t: l } = useLingui();
	const t = useTheme();

	return (
		<View
			style={[{ backgroundColor: disabled ? t.palette.contrast_100 : t.palette.primary_500 }, a.rounded_full]}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={l`Send message`}
				accessibilityHint=""
				hitSlop={HITSLOP_10}
				style={[a.rounded_full, a.align_center, a.justify_center, { height: MIN_HEIGHT, width: MIN_HEIGHT }]}
				onPress={onPress}
				disabled={disabled}
			>
				{loading ? (
					<Loader size="md" fill={t.palette.white} style={[a.mb_2xs]} />
				) : (
					<PaperPlaneIcon size="md" fill={t.palette.white} style={[a.mb_2xs]} />
				)}
			</Pressable>
		</View>
	);
}

// TODO: remove export when MessageInput is deleted
export function ComposerContainer({ children }: { children: React.ReactNode }) {
	useSafeAreaInsets();
	const t = useTheme();

	return (
		<>
			<LinearGradient
				style={[
					a.pt_xs,
					a.pl_lg,
					a.pb_lg,
					// prevent overlap with the scrollbar, which looks ugly
					a.pr_sm, // sm + sm = lg
					{ width: `calc(100% - ${tokens.space.sm}px)` as '100%' },
				]}
				key={t.name} // android does not update when you change the colors. sigh.
				start={[0.5, 0]}
				end={[0.5, 1]}
				colors={[
					utils.alpha(t.atoms.bg.backgroundColor, 0),
					utils.alpha(t.atoms.bg.backgroundColor, 0.8),
					t.atoms.bg.backgroundColor,
				]}
			>
				{children}
			</LinearGradient>
			{/* covers the gap between the keyboard and the input during keyboard animation */}
			{false}
		</>
	);
}
