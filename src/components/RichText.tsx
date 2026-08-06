import type { ReactNode } from 'react';

import type { Handle } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { profileTarget } from '#/lib/routes/targets';
import { isOnlyEmoji } from '#/lib/strings/emoji';
import {
	parseRichtext,
	type Richtext,
	segmentizeRichtext,
	toPlainText,
} from '#/lib/strings/rich-text-facets';
import { parseLinkableUrl, toShortUrl } from '#/lib/strings/url-helpers';

import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { atomicSegment, emoji } from '#/components/RichText.css';
import { RichTextTag } from '#/components/RichTextTag';
import { Text, type TextProps } from '#/components/Text';
import { ContentLinkText, InlineLinkText, type InlineLinkUnderline } from '#/components/web/Link';

export type RichTextProps = Pick<
	TextProps,
	'align' | 'color' | 'leading' | 'numberOfLines' | 'selectable' | 'weight'
> & {
	authorHandle?: Handle;
	className?: string;
	/**
	 * Render mentions as plain links without their profile hover card — set when RichText is itself inside a
	 * hover card, to stop cards cascading.
	 */
	disableHoverCards?: boolean;
	disableLinks?: boolean;
	/** Enlargement applied to emoji-only content: `normal` (1.85×) or `large` (3×). */
	emojiScale?: 'large' | 'normal';
	enableTags?: boolean;
	/** Underline timing for inline links, mentions, and tags; defaults to `hover`. */
	linkUnderline?: InlineLinkUnderline;
	/** The body-text sizes RichText renders (a subset of the full scale), each enlarged for emoji-only content. */
	size?: 'lg' | 'md' | 'md_sub' | 'sm' | 'xl' | 'xs';
	value: Richtext | string;
};

/**
 * renders an atproto richtext value (or a plain string with on-the-fly facet detection) as inline text with
 * mentions, links, and hashtags. mentions and links inherit the text color (defaulting to the link color);
 * emoji-only content is enlarged based on {@link RichTextProps.emojiScale}.
 */
export function RichText({
	align,
	authorHandle,
	className,
	color,
	disableHoverCards,
	disableLinks,
	emojiScale = 'normal',
	enableTags = false,
	leading,
	linkUnderline,
	numberOfLines,
	selectable,
	size,
	value,
	weight,
}: RichTextProps) {
	const segments = typeof value === 'string' ? parseRichtext(value) : segmentizeRichtext(value);

	let text: string | undefined;
	if (segments.every((segment) => segment.type === 'text')) {
		text = toPlainText(segments);
	}

	// emoji-only text is enlarged and unclamped, so it takes its own host rather than the shared one below
	if (text !== undefined && isOnlyEmoji(text)) {
		return (
			<Text
				align={align}
				className={clsx(emoji({ scale: emojiScale, size }), className)}
				color={color}
				leading={leading}
				selectable={selectable}
				weight={weight}
			>
				{text}
			</Text>
		);
	}

	let children: ReactNode = text;
	if (text === undefined) {
		const els: ReactNode[] = [];
		let key = 0;
		for (const segment of segments) {
			let el: ReactNode = segment.text;

			switch (segment.type) {
				case 'link': {
					// reject malformed and non-http(s) facet URIs
					if (disableLinks || parseLinkableUrl(segment.uri) == null) {
						el = toShortUrl(segment.text);
					} else {
						el = (
							<ContentLinkText
								color={color}
								href={segment.uri}
								key={key}
								leading={leading}
								selectable={selectable}
								size={size}
								underline={linkUnderline}
								weight={weight}
							>
								{toShortUrl(segment.text)}
							</ContentLinkText>
						);
					}
					break;
				}
				case 'mention':
				case 'unresolvedMention': {
					const actor = segment.type === 'mention' ? segment.did : segment.handle;

					if (!disableLinks) {
						const link = (
							<InlineLinkText
								className={atomicSegment}
								color={color}
								key={key}
								leading={leading}
								selectable={selectable}
								size={size}
								to={profileTarget(actor)}
								underline={linkUnderline}
								weight={weight}
							>
								{segment.text}
							</InlineLinkText>
						);
						el = disableHoverCards ? (
							link
						) : (
							<ProfileHoverCard actor={actor} key={key}>
								{link}
							</ProfileHoverCard>
						);
					}
					break;
				}
				case 'tag': {
					if (!disableLinks && enableTags) {
						el = (
							<RichTextTag
								authorHandle={authorHandle}
								color={color}
								display={segment.text}
								key={key}
								leading={leading}
								size={size}
								tag={segment.tag}
								underline={linkUnderline}
							/>
						);
					}
					break;
				}
			}

			els.push(el);
			key++;
		}
		children = els;
	}

	return (
		<Text
			align={align}
			className={className}
			color={color}
			leading={leading}
			numberOfLines={numberOfLines}
			selectable={selectable}
			size={size}
			weight={weight}
		>
			{children}
		</Text>
	);
}
