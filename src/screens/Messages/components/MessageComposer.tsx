import { useEffect, useRef, useState } from 'react';

import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';
import { getGraphemeLength } from '@atcute/util-text';

import { MAX_DM_GRAPHEME_LENGTH } from '#/lib/constants';
import { isBskyChatInviteUrl, isBskyPostUrl } from '#/lib/strings/url-helpers';

import { useMessageDraft, useSaveMessageDraft } from '#/state/messages/message-drafts';

import {
	detectLinks,
	type LinkFacetMatch,
	suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util';

import { Composer, useComposerInternalApiRef } from '#/components/Composer';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import * as EmojiPicker from '#/components/EmojiPicker';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import { PaperPlaneVertical_Filled_Stroke2_Corner1_Rounded as PaperPlaneIcon } from '#/components/icons/PaperPlane';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './MessageComposer.css';

const MIN_HEIGHT = 40;
// vertical padding that centers the composer's single line of `md` text (14px × 1.3 snug line-height =
// 18.2px) within the MIN_HEIGHT box, so the one-row input is exactly MIN_HEIGHT and matches the send button.
const COMPOSER_VERTICAL_PADDING = (MIN_HEIGHT - 14 * 1.3) / 2;

export function MessageComposer({
	onSendMessage,
	hasEmbed,
	setEmbed,
	children,
	loading = false,
}: {
	onSendMessage: (message: string, replyTo?: $type.enforce<ChatBskyConvoDefs.MessageView>) => void;
	hasEmbed: boolean;
	setEmbed: (embedUrl: string | undefined) => void;
	children?: React.ReactNode;
	loading?: boolean;
}) {
	const { getDraft, clearDraft } = useMessageDraft();
	const composerInternalApiRef = useComposerInternalApiRef();
	const emojiPickerHandle = EmojiPicker.useEmojiPickerHandle();
	const { replyTo, clearReply } = useMessageReplies();

	const [text, setText] = useState(getDraft);
	useSaveMessageDraft(text);

	// link-card detection state: tracks each keystroke's detected links so a URL is only staged as an embed
	// once it stops changing, rather than mid-typing.
	const prevDetectedUris = useRef(new Map<string, LinkFacetMatch>());
	const pastSuggestedUris = useRef(new Set<string>());
	const prevLength = useRef(text.length);

	useEffect(() => {
		if (!replyTo) {
			return;
		}
		composerInternalApiRef.current?.input?.focus();
	}, [replyTo, composerInternalApiRef]);

	const submitDisabled = loading || (!hasEmbed && text.trim().length === 0);

	const onSubmit = (message: string, replyToMessage: ChatBskyConvoDefs.MessageView | null) => {
		if (loading) {
			return;
		}
		if (!hasEmbed && message.trim() === '') {
			return;
		}
		const graphemeCount = getGraphemeLength(message);
		if (graphemeCount > MAX_DM_GRAPHEME_LENGTH) {
			Toast.show(
				m['screens.messages.composer.tooLongError']({ length: graphemeCount, max: MAX_DM_GRAPHEME_LENGTH }),
				{
					type: 'error',
				},
			);
			return;
		}

		clearDraft();
		setEmbed(undefined);
		clearReply();
		composerInternalApiRef.current?.clear();

		composerInternalApiRef.current?.input?.focus();

		requestAnimationFrame(() => {
			onSendMessage(
				message,
				replyToMessage ? { ...replyToMessage, $type: 'chat.bsky.convo.defs#messageView' } : undefined,
			);
		});
	};

	const handleSubmit = () => {
		onSubmit(text, replyTo);
	};

	const handleChange = (nextText: string) => {
		setText(nextText);

		// a multi-character jump in length is the tell for a paste, which should be staged immediately rather
		// than waiting for the URL to stop changing.
		const mayBePaste = nextText.length > prevLength.current + 1;

		// the DM only embeds bsky posts and chat invites; restrict detection to those so an unrelated link
		// never shadows an embeddable one in the same message.
		const nextDetectedUris = new Map<string, LinkFacetMatch>();
		for (const [uri, match] of detectLinks(nextText)) {
			if (isBskyChatInviteUrl(uri) || isBskyPostUrl(uri)) {
				nextDetectedUris.set(uri, match);
			}
		}
		const suggestedUri = suggestLinkCardUri(
			mayBePaste,
			nextDetectedUris,
			prevDetectedUris.current,
			pastSuggestedUris.current,
		);
		prevDetectedUris.current = nextDetectedUris;
		prevLength.current = nextText.length;
		if (suggestedUri) {
			setEmbed(suggestedUri);
		}
	};

	return (
		<ComposerContainer>
			<div className={styles.row}>
				<div className={styles.inputBox}>
					{children}
					<div className={styles.inputInner}>
						{loading ? null : (
							<>
								<EmojiPicker.Trigger
									handle={emojiPickerHandle}
									render={
										<button
											type="button"
											aria-label={m['common.a11y.openEmojiPicker']()}
											className={styles.emojiButton}
										/>
									}
								>
									<EmojiSmileIcon size="lg" fill="currentColor" />
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
							accessibilityLabel={m['screens.messages.composer.a11y']()}
							accessibilityHint={m['screens.messages.composer.placeholder']()}
							placeholder={
								loading
									? m['screens.messages.conversation.loading']()
									: m['screens.messages.message.action']()
							}
							autocompletePlacement="top-start"
							internalApiRef={composerInternalApiRef}
							defaultValue={text}
							disabled={loading}
							autoFocus={true}
							fontSize="md"
							minRows={1}
							maxRows={12}
							className={styles.editor}
							contentPadding={{
								bottom: COMPOSER_VERTICAL_PADDING,
								left: 16,
								right: 16 + 20,
								top: COMPOSER_VERTICAL_PADDING,
							}}
							onChange={handleChange}
							onRequestSubmit={(req) => {
								if (req.shiftKey) {
									return;
								}
								req.nativeEvent.preventDefault();
								handleSubmit();
							}}
						/>
					</div>
				</div>
				<SubmitButton disabled={submitDisabled} loading={loading} onPress={handleSubmit} />
			</div>
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
	return (
		<button
			aria-label={m['screens.messages.composer.send']()}
			className={styles.submit({ disabled })}
			disabled={disabled}
			onClick={onPress}
			type="button"
		>
			{loading ? (
				<Spinner className={styles.sendIcon} color="white" label={m['common.status.saving']()} size="lg" />
			) : (
				<PaperPlaneIcon className={styles.sendIcon} fill={colors.white} size="lg" />
			)}
		</button>
	);
}

function ComposerContainer({ children }: { children: React.ReactNode }) {
	return <div className={styles.container}>{children}</div>;
}
