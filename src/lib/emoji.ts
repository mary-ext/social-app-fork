const SINGLE_EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+$/u;

export function isOnlyEmoji(text: string) {
	const emoji = text.replace(/\s+/gu, '');
	return emoji.length !== 0 && emoji.length <= 15 && SINGLE_EMOJI_RE.test(emoji);
}
